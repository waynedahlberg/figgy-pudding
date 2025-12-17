"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { CanvasElementRenderer } from "@/components/canvas/canvas-element-renderer";
import { useCanvasDrop } from "@/components/canvas/drag-palette";
import {
  ResizeHandle,
  calculateResize,
  RESIZE_CURSORS,
  ElementBounds,
} from "@/lib/resize-utils";
import {
  handleWheelEvent,
  shouldStartPan,
  getPanCursor,
  stepZoomIn,
  stepZoomOut,
} from "@/lib/pan-zoom-utils";
import {
  calculateAngle,
  calculateRotationDelta,
  normalizeAngle,
  snapAngle,
  getElementCenter,
  ROTATION_CURSOR,
} from "@/lib/rotation-utils";
import {
  snapToGrid,
  applySnapToResize,
} from "@/lib/snap-utils";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

type DragMode = "pan" | "move" | "resize" | "rotate" | null;

interface DragState {
  isDragging: boolean;
  mode: DragMode;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
  elementStartPositions: Map<string, { x: number; y: number }>;
  // Resize-specific state
  resizeElementId: string | null;
  resizeHandle: ResizeHandle | null;
  resizeStartBounds: ElementBounds | null;
  // Rotate-specific state
  rotateElementId: string | null;
  rotateStartAngle: number;
  rotateElementStartRotation: number;
  rotateCenter: { x: number; y: number } | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function InfiniteCanvas() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas store
  const {
    panX,
    panY,
    zoom,
    elements,
    selectedIds,
    snapToGrid: snapEnabled,
    gridSize,
    showGrid,
    setPan,
    setZoom,
    selectElement,
    deselectAll,
    updateElement,
    deleteElements,
  } = useCanvasStore();

  // Drag and drop from palette
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useCanvasDrop();

  // Local state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    mode: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    elementStartPositions: new Map(),
    resizeElementId: null,
    resizeHandle: null,
    resizeStartBounds: null,
    rotateElementId: null,
    rotateStartAngle: 0,
    rotateElementStartRotation: 0,
    rotateCenter: null,
  });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [mousePos, setMousePos] = useState({
    screen: { x: 0, y: 0 },
    canvas: { x: 0, y: 0 },
  });

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        deleteElements(selectedIds);
      }

      if (e.key === "Escape") {
        deselectAll();
      }

      if (e.metaKey || e.ctrlKey) {
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const centerX = rect ? rect.width / 2 : 0;
        const centerY = rect ? rect.height / 2 : 0;

        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          const result = stepZoomIn(panX, panY, zoom, centerX, centerY);
          setPan(result.panX, result.panY);
          setZoom(result.zoom);
        } else if (e.key === "-") {
          e.preventDefault();
          const result = stepZoomOut(panX, panY, zoom, centerX, centerY);
          setPan(result.panX, result.panY);
          setZoom(result.zoom);
        } else if (e.key === "0") {
          e.preventDefault();
          setPan(0, 0);
          setZoom(1);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setDragState((prev) =>
          prev.mode === "pan" ? { ...prev, isDragging: false, mode: null } : prev
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedIds, deleteElements, deselectAll, panX, panY, zoom, setPan, setZoom]);

  // =============================================================================
  // CANVAS MOUSE HANDLERS
  // =============================================================================

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (shouldStartPan(e.button, isSpacePressed)) {
        e.preventDefault();
        setDragState({
          isDragging: true,
          mode: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startPanX: panX,
          startPanY: panY,
          elementStartPositions: new Map(),
          resizeElementId: null,
          resizeHandle: null,
          resizeStartBounds: null,
          rotateElementId: null,
          rotateStartAngle: 0,
          rotateElementStartRotation: 0,
          rotateCenter: null,
        });
        return;
      }

      if (e.button === 0) {
        deselectAll();
      }
    },
    [panX, panY, isSpacePressed, deselectAll]
  );

  // =============================================================================
  // ELEMENT MOUSE DOWN (for moving)
  // =============================================================================

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();

      if (isSpacePressed) {
        handleCanvasMouseDown(e);
        return;
      }

      const element = elements.find((el) => el.id === elementId);
      if (!element || element.locked) return;

      const isShiftPressed = e.shiftKey;
      const isAlreadySelected = selectedIds.includes(elementId);

      let idsToMove: string[];

      if (isShiftPressed) {
        selectElement(elementId, true);
        if (isAlreadySelected) {
          idsToMove = selectedIds.filter((id) => id !== elementId);
        } else {
          idsToMove = [...selectedIds, elementId];
        }
      } else if (isAlreadySelected) {
        idsToMove = selectedIds;
      } else {
        selectElement(elementId, false);
        idsToMove = [elementId];
      }

      const startPositions = new Map<string, { x: number; y: number }>();
      elements.forEach((el) => {
        if (idsToMove.includes(el.id) && !el.locked) {
          startPositions.set(el.id, { x: el.x, y: el.y });
        }
      });

      setDragState({
        isDragging: true,
        mode: "move",
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panX,
        startPanY: panY,
        elementStartPositions: startPositions,
        resizeElementId: null,
        resizeHandle: null,
        resizeStartBounds: null,
        rotateElementId: null,
        rotateStartAngle: 0,
        rotateElementStartRotation: 0,
        rotateCenter: null,
      });
    },
    [elements, selectedIds, selectElement, panX, panY, isSpacePressed, handleCanvasMouseDown]
  );

  // =============================================================================
  // RESIZE START
  // =============================================================================

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
      e.stopPropagation();

      const element = elements.find((el) => el.id === elementId);
      if (!element || element.locked) return;

      if (!selectedIds.includes(elementId)) {
        selectElement(elementId, false);
      }

      setDragState({
        isDragging: true,
        mode: "resize",
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panX,
        startPanY: panY,
        elementStartPositions: new Map(),
        resizeElementId: elementId,
        resizeHandle: handle,
        resizeStartBounds: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        },
        rotateElementId: null,
        rotateStartAngle: 0,
        rotateElementStartRotation: 0,
        rotateCenter: null,
      });
    },
    [elements, selectedIds, selectElement, panX, panY]
  );

  // =============================================================================
  // ROTATE START
  // =============================================================================

  const handleRotateStart = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();

      const element = elements.find((el) => el.id === elementId);
      if (!element || element.locked) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const center = getElementCenter(element.x, element.y, element.width, element.height);
      const screenCenterX = center.x * zoom + panX + rect.left;
      const screenCenterY = center.y * zoom + panY + rect.top;

      const startAngle = calculateAngle(screenCenterX, screenCenterY, e.clientX, e.clientY);

      setDragState({
        isDragging: true,
        mode: "rotate",
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panX,
        startPanY: panY,
        elementStartPositions: new Map(),
        resizeElementId: null,
        resizeHandle: null,
        resizeStartBounds: null,
        rotateElementId: elementId,
        rotateStartAngle: startAngle,
        rotateElementStartRotation: element.rotation,
        rotateCenter: { x: screenCenterX, y: screenCenterY },
      });
    },
    [elements, panX, panY, zoom]
  );

  // =============================================================================
  // MOUSE MOVE
  // =============================================================================

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - panX) / zoom;
      const canvasY = (screenY - panY) / zoom;

      setMousePos({
        screen: { x: Math.round(screenX), y: Math.round(screenY) },
        canvas: { x: Math.round(canvasX), y: Math.round(canvasY) },
      });

      if (!dragState.isDragging) return;

      const pixelDeltaX = e.clientX - dragState.startX;
      const pixelDeltaY = e.clientY - dragState.startY;

      if (dragState.mode === "pan") {
        setPan(dragState.startPanX + pixelDeltaX, dragState.startPanY + pixelDeltaY);
      } else if (dragState.mode === "move") {
        const canvasDeltaX = pixelDeltaX / zoom;
        const canvasDeltaY = pixelDeltaY / zoom;

        dragState.elementStartPositions.forEach((startPos, id) => {
          let newX = startPos.x + canvasDeltaX;
          let newY = startPos.y + canvasDeltaY;

          // Apply grid snapping if enabled
          if (snapEnabled) {
            newX = snapToGrid(newX, gridSize);
            newY = snapToGrid(newY, gridSize);
          }

          updateElement(id, { x: newX, y: newY });
        });
      } else if (dragState.mode === "resize") {
        if (!dragState.resizeHandle || !dragState.resizeStartBounds || !dragState.resizeElementId) {
          return;
        }

        const canvasDeltaX = pixelDeltaX / zoom;
        const canvasDeltaY = pixelDeltaY / zoom;

        let newBounds = calculateResize(
          dragState.resizeHandle,
          dragState.resizeStartBounds,
          canvasDeltaX,
          canvasDeltaY,
          {
            minWidth: 20,
            minHeight: 20,
            lockAspectRatio: e.shiftKey,
            aspectRatio: e.shiftKey
              ? dragState.resizeStartBounds.width / dragState.resizeStartBounds.height
              : null,
          }
        );

        // Apply grid snapping to resize if enabled
        if (snapEnabled) {
          newBounds = applySnapToResize(newBounds, gridSize, true);
        }

        updateElement(dragState.resizeElementId, {
          x: newBounds.x,
          y: newBounds.y,
          width: newBounds.width,
          height: newBounds.height,
        });
      } else if (dragState.mode === "rotate") {
        if (!dragState.rotateElementId || !dragState.rotateCenter) {
          return;
        }

        const currentAngle = calculateAngle(
          dragState.rotateCenter.x,
          dragState.rotateCenter.y,
          e.clientX,
          e.clientY
        );

        const rotationDelta = calculateRotationDelta(dragState.rotateStartAngle, currentAngle);
        let newRotation = dragState.rotateElementStartRotation + rotationDelta;

        // Snap to 15° increments when shift is held
        if (e.shiftKey) {
          newRotation = snapAngle(newRotation, 15);
        }

        newRotation = normalizeAngle(newRotation);

        updateElement(dragState.rotateElementId, {
          rotation: newRotation,
        });
      }
    },
    [dragState, panX, panY, zoom, setPan, updateElement, snapEnabled, gridSize]
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      mode: null,
      elementStartPositions: new Map(),
      resizeElementId: null,
      resizeHandle: null,
      resizeStartBounds: null,
      rotateElementId: null,
      rotateStartAngle: 0,
      rotateElementStartRotation: 0,
      rotateCenter: null,
    }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (dragState.isDragging) {
      setDragState((prev) => ({
        ...prev,
        isDragging: false,
        mode: null,
        elementStartPositions: new Map(),
        resizeElementId: null,
        resizeHandle: null,
        resizeStartBounds: null,
        rotateElementId: null,
        rotateStartAngle: 0,
        rotateElementStartRotation: 0,
        rotateCenter: null,
      }));
    }
  }, [dragState.isDragging]);

  // =============================================================================
  // WHEEL HANDLER
  // =============================================================================

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const result = handleWheelEvent(
        { panX, panY, zoom },
        {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          clientX: e.clientX,
          clientY: e.clientY,
        },
        rect
      );

      if (result.panX !== panX || result.panY !== panY) {
        setPan(result.panX, result.panY);
      }
      if (result.zoom !== zoom) {
        setZoom(result.zoom);
      }
    },
    [panX, panY, zoom, setPan, setZoom]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventWheel = (e: WheelEvent) => e.preventDefault();
    container.addEventListener("wheel", preventWheel, { passive: false });
    return () => container.removeEventListener("wheel", preventWheel);
  }, []);

  // =============================================================================
  // DROP HANDLER
  // =============================================================================

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      handleDrop(e, rect);
    },
    [handleDrop]
  );

  // =============================================================================
  // GRID & CURSOR
  // =============================================================================

  const scaledGridSize = gridSize * zoom;
  const gridOffsetX = panX % scaledGridSize;
  const gridOffsetY = panY % scaledGridSize;

  const getCursor = () => {
    if (dragState.isDragging) {
      if (dragState.mode === "resize" && dragState.resizeHandle) {
        return RESIZE_CURSORS[dragState.resizeHandle];
      }
      if (dragState.mode === "rotate") {
        return ROTATION_CURSOR;
      }
      if (dragState.mode === "move") {
        return "move";
      }
    }
    return getPanCursor(isSpacePressed, dragState.mode === "pan");
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full overflow-hidden relative select-none",
        isDragOver && "ring-2 ring-accent ring-inset"
      )}
      style={{ cursor: getCursor() }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={onDrop}
    >
      {/* Grid Background */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-border-subtle) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border-subtle) 1px, transparent 1px)
            `,
            backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
            backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
          }}
        />
      )}

      {/* Origin Crosshair */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: panX,
          top: panY,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="absolute bg-accent/50"
          style={{ width: 20 * zoom, height: 2, left: -10 * zoom, top: -1 }}
        />
        <div
          className="absolute bg-accent/50"
          style={{ width: 2, height: 20 * zoom, left: -1, top: -10 * zoom }}
        />
      </div>

      {/* Canvas Elements Layer */}
      <div
        className="absolute"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {elements.map((element) => (
          <CanvasElementRenderer
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            zoom={zoom}
            onMouseDown={handleElementMouseDown}
            onResizeStart={handleResizeStart}
            onRotateStart={handleRotateStart}
          />
        ))}
      </div>

      {/* Drop indicator overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-accent/5 pointer-events-none flex items-center justify-center">
          <div className="bg-surface1/90 backdrop-blur-sm rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent">
            Drop to add element
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 bg-surface1/90 backdrop-blur-sm rounded-lg border border-border-subtle p-3 text-xs font-mono pointer-events-none">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-text-muted">Pan:</span>
          <span className="text-text-primary">
            {Math.round(panX)}, {Math.round(panY)}
          </span>
          <span className="text-text-muted">Zoom:</span>
          <span className="text-text-primary">{Math.round(zoom * 100)}%</span>
          <span className="text-text-muted">Mouse (canvas):</span>
          <span className="text-accent">
            {mousePos.canvas.x}, {mousePos.canvas.y}
          </span>
          <span className="text-text-muted">Snap:</span>
          <span className={snapEnabled ? "text-green-400" : "text-text-muted"}>
            {snapEnabled ? `ON (${gridSize}px)` : "OFF"}
          </span>
        </div>
      </div>

      {/* Pan Mode Indicator */}
      {isSpacePressed && !dragState.isDragging && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface1/90 backdrop-blur-sm rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary pointer-events-none">
          Pan Mode — Click and drag to pan
        </div>
      )}
    </div>
  );
}

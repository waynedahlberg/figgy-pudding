"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { SVGElementRenderer } from "./svg-element-renderer";
import { usePenTool, PenToolOverlay } from "./pen-tool";
import { ResizeHandle, RESIZE_CURSORS, calculateResize } from "@/lib/resize-utils";
import {
  ROTATION_CURSOR,
  calculateAngle,
  calculateRotationDelta,
  normalizeAngle,
  snapAngle,
  getElementCenter,
} from "@/lib/rotation-utils";
import { snapToGrid, applySnapToResize } from "@/lib/snap-utils";
import { shouldStartPan, getPanCursor, handleWheelEvent } from "@/lib/pan-zoom-utils";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface DragState {
  isDragging: boolean;
  mode: "pan" | "move" | "resize" | "rotate" | null;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
  elementStartPositions: Map<string, { x: number; y: number }>;
  resizeElementId: string | null;
  resizeHandle: ResizeHandle | null;
  resizeStartBounds: { x: number; y: number; width: number; height: number } | null;
  rotateElementId: string | null;
  rotateStartAngle: number;
  rotateElementStartRotation: number;
  rotateCenter: { x: number; y: number } | null;
}

// =============================================================================
// DROP HOOK
// =============================================================================

function useCanvasDrop() {
  const { addElement, panX, panY, zoom } = useCanvasStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, rect: DOMRect) => {
      e.preventDefault();
      setIsDragOver(false);

      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      try {
        const item = JSON.parse(data);
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasX = (screenX - panX) / zoom - item.defaultWidth / 2;
        const canvasY = (screenY - panY) / zoom - item.defaultHeight / 2;

        const colors = [
          { fill: "rgba(99, 102, 241, 0.2)", stroke: "rgb(99, 102, 241)" },
          { fill: "rgba(236, 72, 153, 0.2)", stroke: "rgb(236, 72, 153)" },
          { fill: "rgba(34, 197, 94, 0.2)", stroke: "rgb(34, 197, 94)" },
          { fill: "rgba(249, 115, 22, 0.2)", stroke: "rgb(249, 115, 22)" },
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        addElement({
          type: item.type,
          x: canvasX,
          y: canvasY,
          width: item.defaultWidth,
          height: item.defaultHeight,
          rotation: 0,
          fill: randomColor.fill,
          stroke: randomColor.stroke,
          strokeWidth: 2,
          name: item.label,
          locked: false,
          visible: true,
        });
      } catch (error) {
        console.error("Failed to parse drop data:", error);
      }
    },
    [addElement, panX, panY, zoom]
  );

  return { isDragOver, handleDragOver, handleDragLeave, handleDrop };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    panX,
    panY,
    zoom,
    elements,
    selectedIds,
    snapToGrid: snapEnabled,
    gridSize,
    showGrid,
    activeTool,
    setPan,
    setZoom,
    animateZoomIn,
    animateZoomOut,
    animateResetView,
    selectElement,
    deselectAll,
    updateElement,
    deleteElements,
    setActiveTool,
  } = useCanvasStore();

  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useCanvasDrop();
  
  // Pen tool integration
  const { 
    penState, 
    handleMouseDown: handlePenMouseDown, 
    handleMouseMove: handlePenMouseMove, 
    handleMouseUp: handlePenMouseUp,
    handleDoubleClick: handlePenDoubleClick,
  } = usePenTool();

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
        if (activeTool === "pen" && penState.isDrawing) {
          // Pen tool handles its own escape
          return;
        }
        deselectAll();
        setActiveTool("select");
      }

      // Tool shortcuts (only when no modifiers)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          setActiveTool("select");
        }
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          setActiveTool("pen");
        }
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          setActiveTool("rectangle");
        }
        if (e.key === "o" || e.key === "O") {
          e.preventDefault();
          setActiveTool("ellipse");
        }
      }

      // Animated zoom shortcuts
      if (e.metaKey || e.ctrlKey) {
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const centerX = rect ? rect.width / 2 : 0;
        const centerY = rect ? rect.height / 2 : 0;

        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          animateZoomIn(centerX, centerY);
        } else if (e.key === "-") {
          e.preventDefault();
          animateZoomOut(centerX, centerY);
        } else if (e.key === "0") {
          e.preventDefault();
          animateResetView();
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
  }, [selectedIds, deleteElements, deselectAll, animateZoomIn, animateZoomOut, animateResetView, activeTool, penState.isDrawing, setActiveTool]);

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

      // Handle pen tool mouse down
      if (activeTool === "pen" && e.button === 0) {
        const container = containerRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - panX) / zoom;
        const canvasY = (e.clientY - rect.top - panY) / zoom;
        
        handlePenMouseDown(canvasX, canvasY, e);
        return;
      }

      if (e.button === 0) {
        deselectAll();
      }
    },
    [panX, panY, zoom, isSpacePressed, deselectAll, activeTool, handlePenMouseDown]
  );

  // =============================================================================
  // ELEMENT MOUSE DOWN
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

      // Update pen tool (handles both preview and dragging for curves)
      if (activeTool === "pen") {
        handlePenMouseMove(canvasX, canvasY, e);
      }

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

        if (e.shiftKey) {
          newRotation = snapAngle(newRotation, 15);
        }

        newRotation = normalizeAngle(newRotation);

        updateElement(dragState.rotateElementId, {
          rotation: newRotation,
        });
      }
    },
    [dragState, panX, panY, zoom, setPan, updateElement, snapEnabled, gridSize, activeTool, handlePenMouseMove]
  );

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Handle pen tool mouse up
    if (activeTool === "pen") {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - panX) / zoom;
        const canvasY = (e.clientY - rect.top - panY) / zoom;
        handlePenMouseUp(canvasX, canvasY, e);
      }
    }
    
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
  }, [activeTool, panX, panY, zoom, handlePenMouseUp]);

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
  // GRID PATTERN
  // =============================================================================

  const scaledGridSize = gridSize * zoom;
  const gridPatternId = "canvas-grid-pattern";

  // =============================================================================
  // CURSOR
  // =============================================================================

  const getCursor = useCallback(() => {
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
      if (dragState.mode === "pan") {
        return "grabbing";
      }
    }
    
    // Space pressed for pan mode
    if (isSpacePressed) {
      return "grab";
    }
    
    // Tool-specific cursors
    if (activeTool === "pen") {
      return "crosshair";
    }
    if (activeTool === "rectangle" || activeTool === "ellipse") {
      return "crosshair";
    }
    
    return "default";
  }, [dragState.isDragging, dragState.mode, dragState.resizeHandle, isSpacePressed, activeTool]);
  
  // Force cursor update when activeTool changes
  const currentCursor = getCursor();

  // Double-click handler for pen tool
  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === "pen") {
        const container = containerRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - panX) / zoom;
        const canvasY = (e.clientY - rect.top - panY) / zoom;
        
        handlePenDoubleClick(canvasX, canvasY);
      }
    },
    [activeTool, panX, panY, zoom, handlePenDoubleClick]
  );

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
      style={{ cursor: currentCursor }}
      data-tool={activeTool}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleCanvasDoubleClick}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={onDrop}
    >
      {/* SVG Canvas */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ backgroundColor: "transparent" }}
      >
        {/* Grid pattern definition */}
        {showGrid && (
          <defs>
            <pattern
              id={gridPatternId}
              width={scaledGridSize}
              height={scaledGridSize}
              patternUnits="userSpaceOnUse"
              x={panX % scaledGridSize}
              y={panY % scaledGridSize}
            >
              <path
                d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
        )}

        {/* Grid background */}
        {showGrid && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${gridPatternId})`}
          />
        )}

        {/* Origin crosshair */}
        <g transform={`translate(${panX}, ${panY})`}>
          <line
            x1={-10 * zoom}
            y1={0}
            x2={10 * zoom}
            y2={0}
            stroke="var(--color-accent)"
            strokeWidth="2"
            opacity="0.5"
          />
          <line
            x1={0}
            y1={-10 * zoom}
            x2={0}
            y2={10 * zoom}
            stroke="var(--color-accent)"
            strokeWidth="2"
            opacity="0.5"
          />
        </g>

        {/* Canvas elements layer */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {elements.map((element) => (
            <SVGElementRenderer
              key={element.id}
              element={element}
              isSelected={selectedIds.includes(element.id)}
              zoom={zoom}
              onMouseDown={handleElementMouseDown}
              onResizeStart={handleResizeStart}
              onRotateStart={handleRotateStart}
            />
          ))}
          
          {/* Pen tool preview overlay */}
          {activeTool === "pen" && (
            <PenToolOverlay penState={penState} zoom={zoom} />
          )}
        </g>
      </svg>

      {/* Drop indicator */}
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
          <span className="text-text-muted">Tool:</span>
          <span className={activeTool === "pen" ? "text-pink-400" : "text-purple-400"}>
            {activeTool.toUpperCase()}
          </span>
          <span className="text-text-muted">Renderer:</span>
          <span className="text-purple-400">SVG</span>
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

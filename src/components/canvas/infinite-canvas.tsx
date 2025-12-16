"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { CanvasElementRenderer } from "@/components/canvas/canvas-element-renderer";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface DragState {
  isDragging: boolean;
  mode: "pan" | "move" | null;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
  // Store the ORIGINAL positions when drag started
  elementStartPositions: Map<string, { x: number; y: number }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GRID_SIZE = 20;
const WHEEL_ZOOM_SPEED = 0.001;

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
    setPan,
    zoomTo,
    zoomIn,
    zoomOut,
    resetView,
    selectElement,
    deselectAll,
    updateElement,
    deleteElements,
  } = useCanvasStore();

  // Local state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    mode: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    elementStartPositions: new Map(),
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
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Space for pan mode
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      // Delete/Backspace to delete selected
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        deleteElements(selectedIds);
      }

      // Escape to deselect
      if (e.key === "Escape") {
        deselectAll();
      }

      // Zoom shortcuts
      if (e.metaKey || e.ctrlKey) {
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const centerX = rect ? rect.width / 2 : 0;
        const centerY = rect ? rect.height / 2 : 0;

        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomIn(centerX, centerY);
        } else if (e.key === "-") {
          e.preventDefault();
          zoomOut(centerX, centerY);
        } else if (e.key === "0") {
          e.preventDefault();
          resetView();
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
  }, [selectedIds, deleteElements, deselectAll, zoomIn, zoomOut, resetView]);

  // =============================================================================
  // ELEMENT MOUSE DOWN - Start dragging element(s)
  // =============================================================================

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();

      const element = elements.find((el) => el.id === elementId);
      if (!element || element.locked) return;

      // Handle selection
      const isShiftPressed = e.shiftKey;
      const isAlreadySelected = selectedIds.includes(elementId);

      let idsToMove: string[];

      if (isShiftPressed) {
        // Shift-click: toggle selection
        selectElement(elementId, true);
        // If adding to selection, include in move; if removing, use remaining
        if (isAlreadySelected) {
          idsToMove = selectedIds.filter((id) => id !== elementId);
        } else {
          idsToMove = [...selectedIds, elementId];
        }
      } else if (isAlreadySelected) {
        // Already selected without shift: move all selected
        idsToMove = selectedIds;
      } else {
        // Click on unselected: select only this one
        selectElement(elementId, false);
        idsToMove = [elementId];
      }

      // Store the STARTING positions of all elements we're going to move
      const startPositions = new Map<string, { x: number; y: number }>();
      elements.forEach((el) => {
        if (idsToMove.includes(el.id) && !el.locked) {
          startPositions.set(el.id, { x: el.x, y: el.y });
        }
      });

      // Start drag
      setDragState({
        isDragging: true,
        mode: "move",
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panX,
        startPanY: panY,
        elementStartPositions: startPositions,
      });
    },
    [elements, selectedIds, selectElement, panX, panY]
  );

  // =============================================================================
  // CANVAS MOUSE HANDLERS
  // =============================================================================

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button always pans
      if (e.button === 1) {
        e.preventDefault();
        setDragState({
          isDragging: true,
          mode: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startPanX: panX,
          startPanY: panY,
          elementStartPositions: new Map(),
        });
        return;
      }

      // Left button
      if (e.button === 0) {
        // Space+Left = pan
        if (isSpacePressed) {
          setDragState({
            isDragging: true,
            mode: "pan",
            startX: e.clientX,
            startY: e.clientY,
            startPanX: panX,
            startPanY: panY,
            elementStartPositions: new Map(),
          });
          return;
        }

        // Left click on empty canvas = deselect
        deselectAll();
      }
    },
    [panX, panY, isSpacePressed, deselectAll]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Update mouse position display
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - panX) / zoom;
      const canvasY = (screenY - panY) / zoom;

      setMousePos({
        screen: { x: Math.round(screenX), y: Math.round(screenY) },
        canvas: { x: Math.round(canvasX), y: Math.round(canvasY) },
      });

      // Handle dragging
      if (!dragState.isDragging) return;

      // Calculate pixel delta from drag start
      const pixelDeltaX = e.clientX - dragState.startX;
      const pixelDeltaY = e.clientY - dragState.startY;

      if (dragState.mode === "pan") {
        // Pan: pixel delta applied directly
        setPan(dragState.startPanX + pixelDeltaX, dragState.startPanY + pixelDeltaY);
      } else if (dragState.mode === "move") {
        // Move elements: convert pixel delta to canvas delta
        const canvasDeltaX = pixelDeltaX / zoom;
        const canvasDeltaY = pixelDeltaY / zoom;

        // Update each element to: startPosition + canvasDelta
        dragState.elementStartPositions.forEach((startPos, id) => {
          updateElement(id, {
            x: startPos.x + canvasDeltaX,
            y: startPos.y + canvasDeltaY,
          });
        });
      }
    },
    [dragState, panX, panY, zoom, setPan, updateElement]
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      mode: null,
      elementStartPositions: new Map(),
    }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Only stop drag if we leave the container
    if (dragState.isDragging) {
      setDragState((prev) => ({
        ...prev,
        isDragging: false,
        mode: null,
        elementStartPositions: new Map(),
      }));
    }
  }, [dragState.isDragging]);

  // =============================================================================
  // WHEEL ZOOM
  // =============================================================================

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomDelta = -e.deltaY * WHEEL_ZOOM_SPEED;
      const newZoom = zoom * (1 + zoomDelta);

      zoomTo(newZoom, mouseX, mouseY);
    },
    [zoom, zoomTo]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventWheel = (e: WheelEvent) => e.preventDefault();
    container.addEventListener("wheel", preventWheel, { passive: false });
    return () => container.removeEventListener("wheel", preventWheel);
  }, []);

  // =============================================================================
  // GRID
  // =============================================================================

  const gridSize = GRID_SIZE * zoom;
  const gridOffsetX = panX % gridSize;
  const gridOffsetY = panY % gridSize;

  const getCursor = () => {
    if (dragState.isDragging && dragState.mode === "pan") return "grabbing";
    if (dragState.isDragging && dragState.mode === "move") return "move";
    if (isSpacePressed) return "grab";
    return "default";
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none"
      style={{ cursor: getCursor() }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border-subtle) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
        }}
      />

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
            onMouseDown={handleElementMouseDown}
          />
        ))}
      </div>

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
          <span className="text-text-muted">Selected:</span>
          <span className="text-text-primary">{selectedIds.length} elements</span>
        </div>
      </div>

      {/* Mode Indicators */}
      {isSpacePressed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface1/90 backdrop-blur-sm rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary pointer-events-none">
          Pan Mode — Click and drag to pan
        </div>
      )}
    </div>
  );
}

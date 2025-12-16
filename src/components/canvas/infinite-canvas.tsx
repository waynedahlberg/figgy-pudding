"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// TYPES

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
}

// CONSTANTS

// Grid settings
const GRID_SIZE = 20; // pixels between grid lines at 100% zoom

// COMPONENT

export function InfiniteCanvas() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas store (pan, zoom, etc.)
  const { panX, panY, zoom, setPan } = useCanvasStore();

  // Local state for dragging
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Track mouse position for coordinate display
  const [mousePos, setMousePos] = useState({ screen: { x: 0, y: 0 }, canvas: { x: 0, y: 0 } });

  // EVENT HANDLERS

  // Handle mouse down - start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan with middle mouse button or left button + space (handled elsewhere)
      // For now, let's use left mouse button for panning
      if (e.button === 0) {
        setDragState({
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          startPanX: panX,
          startPanY: panY,
        });
      }
    },
    [panX, panY]
  );

  // Handle mouse move - update pan if dragging, always update mouse position
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
      if (dragState.isDragging) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        setPan(dragState.startPanX + deltaX, dragState.startPanY + deltaY);
      }
    },
    [dragState, panX, panY, zoom, setPan]
  );

  // Handle mouse up - stop dragging
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Handle mouse leave - stop dragging
  const handleMouseLeave = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // GRID PATTERN

  // Calculate grid pattern based on zoom
  const gridSize = GRID_SIZE * zoom;

  // Grid offset based on pan (so grid moves with canvas)
  const gridOffsetX = panX % gridSize;
  const gridOffsetY = panY % gridSize;

  // RENDER

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full overflow-hidden relative",
        dragState.isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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

      {/* Canvas Origin Marker */}
      <div
        className="absolute w-4 h-4 pointer-events-none"
        style={{
          left: panX - 8,
          top: panY - 8,
        }}
      >
        {/* Horizontal line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-accent" />
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-accent" />
      </div>

      {/* Canvas Content Layer - elements will be rendered here */}
      <div
        className="absolute"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Sample elements for visualization */}
        <SampleElements />
      </div>

      {/* Debug Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-surface1/90 backdrop-blur-sm rounded-lg border border-border-subtle p-3 text-xs font-mono pointer-events-none">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-text-muted">Pan:</span>
          <span className="text-text-primary">
            {Math.round(panX)}, {Math.round(panY)}
          </span>
          <span className="text-text-muted">Zoom:</span>
          <span className="text-text-primary">{Math.round(zoom * 100)}%</span>
          <span className="text-text-muted">Mouse (screen):</span>
          <span className="text-text-primary">
            {mousePos.screen.x}, {mousePos.screen.y}
          </span>
          <span className="text-text-muted">Mouse (canvas):</span>
          <span className="text-accent">
            {mousePos.canvas.x}, {mousePos.canvas.y}
          </span>
        </div>
      </div>
    </div>
  );
}

// SAMPLE ELEMENTS (for visualization)

function SampleElements() {
  return (
    <>
      {/* Origin marker */}
      <div
        className="absolute bg-accent/20 border-2 border-accent rounded-lg flex items-center justify-center text-xs font-medium text-accent"
        style={{
          left: -50,
          top: -25,
          width: 100,
          height: 50,
        }}
      >
        Origin (0,0)
      </div>

      {/* Sample rectangle at (100, 100) */}
      <div
        className="absolute bg-purple-500/20 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xs font-medium text-purple-400"
        style={{
          left: 100,
          top: 100,
          width: 150,
          height: 100,
        }}
      >
        (100, 100)
      </div>

      {/* Sample rectangle at (-200, 50) */}
      <div
        className="absolute bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-center justify-center text-xs font-medium text-blue-400"
        style={{
          left: -200,
          top: 50,
          width: 120,
          height: 80,
        }}
      >
        (-200, 50)
      </div>

      {/* Sample rectangle at (50, -150) */}
      <div
        className="absolute bg-orange-500/20 border-2 border-orange-500 rounded-lg flex items-center justify-center text-xs font-medium text-orange-400"
        style={{
          left: 50,
          top: -150,
          width: 100,
          height: 60,
        }}
      >
        (50, -150)
      </div>
    </>
  );
}

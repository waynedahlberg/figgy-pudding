"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import {
  PathData,
  moveTo,
  lineTo,
  updatePathString,
  getPathBoundingBox,
  getFirstAnchor,
} from "@/lib/path-utils";

// =============================================================================
// TYPES
// =============================================================================

interface PenToolState {
  isDrawing: boolean;
  currentPath: PathData | null;
  previewPoint: { x: number; y: number } | null;
}

interface UsePenToolReturn {
  penState: PenToolState;
  handleCanvasClick: (canvasX: number, canvasY: number) => void;
  handleMouseMove: (canvasX: number, canvasY: number) => void;
  finishPath: (close?: boolean) => void;
  cancelPath: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CLOSE_THRESHOLD = 10; // Distance in canvas units to close path

// Default colors for new paths
const PATH_COLORS = [
  { fill: "none", stroke: "rgb(99, 102, 241)" },
  { fill: "none", stroke: "rgb(236, 72, 153)" },
  { fill: "none", stroke: "rgb(34, 197, 94)" },
  { fill: "none", stroke: "rgb(249, 115, 22)" },
  { fill: "none", stroke: "rgb(14, 165, 233)" },
  { fill: "none", stroke: "rgb(168, 85, 247)" },
];

function getRandomPathColor() {
  return PATH_COLORS[Math.floor(Math.random() * PATH_COLORS.length)];
}

// =============================================================================
// PEN TOOL HOOK
// =============================================================================

export function usePenTool(): UsePenToolReturn {
  const { activeTool, addElement, selectElement, setActiveTool, zoom } = useCanvasStore();

  const [penState, setPenState] = useState<PenToolState>({
    isDrawing: false,
    currentPath: null,
    previewPoint: null,
  });

  // Store color for current path
  const currentColorRef = useRef(getRandomPathColor());
  const previousToolRef = useRef(activeTool);
  
  // Ref to track paths that need to be finalized (deferred to avoid setState during render)
  const pendingPathRef = useRef<{ path: PathData; closed: boolean } | null>(null);

  // Internal function to finish path and create element
  const finishPathInternal = useCallback(
    (path: PathData, closed: boolean) => {
      if (!path || path.points.length < 2) return;

      const bounds = getPathBoundingBox(path);
      const color = currentColorRef.current;

      const elementId = addElement({
        type: "path",
        x: bounds.x,
        y: bounds.y,
        width: Math.max(bounds.width, 1),
        height: Math.max(bounds.height, 1),
        rotation: 0,
        fill: closed ? "rgba(99, 102, 241, 0.1)" : "none",
        stroke: color.stroke,
        strokeWidth: 2,
        name: closed ? "Closed Path" : "Path",
        locked: false,
        visible: true,
        pathData: {
          ...path,
          closed,
        },
      });

      selectElement(elementId, false);
    },
    [addElement, selectElement]
  );

  // Process any pending path creation (runs after render)
  useEffect(() => {
    if (pendingPathRef.current) {
      const { path, closed } = pendingPathRef.current;
      pendingPathRef.current = null;
      finishPathInternal(path, closed);
    }
  });

  // Handle click on canvas to add point
  const handleCanvasClick = useCallback(
    (canvasX: number, canvasY: number) => {
      if (activeTool !== "pen") return;

      setPenState((prev) => {
        // If not currently drawing, start a new path
        if (!prev.isDrawing || !prev.currentPath) {
          currentColorRef.current = getRandomPathColor();
          const newPath: PathData = {
            points: [moveTo(canvasX, canvasY)],
            closed: false,
          };
          return {
            isDrawing: true,
            currentPath: updatePathString(newPath),
            previewPoint: null,
          };
        }

        // Check if clicking near the first point to close the path
        const firstAnchor = getFirstAnchor(prev.currentPath);
        if (firstAnchor && prev.currentPath.points.length > 2) {
          const distance = Math.sqrt(
            Math.pow(canvasX - firstAnchor.x, 2) + Math.pow(canvasY - firstAnchor.y, 2)
          );

          if (distance < CLOSE_THRESHOLD / zoom) {
            // Close the path - defer element creation to after render
            const closedPath = updatePathString({
              ...prev.currentPath,
              closed: true,
            });
            
            // Schedule element creation for after this render
            pendingPathRef.current = { path: closedPath, closed: true };

            return {
              isDrawing: false,
              currentPath: null,
              previewPoint: null,
            };
          }
        }

        // Add a new point to the path
        const newPoint = lineTo(canvasX, canvasY);
        const newPath: PathData = {
          ...prev.currentPath,
          points: [...prev.currentPath.points, newPoint],
        };

        return {
          ...prev,
          currentPath: updatePathString(newPath),
        };
      });
    },
    [activeTool, zoom]
  );

  // Handle mouse move for preview line
  const handleMouseMove = useCallback(
    (canvasX: number, canvasY: number) => {
      if (activeTool !== "pen") return;

      setPenState((prev) => {
        if (!prev.isDrawing) return prev;
        return {
          ...prev,
          previewPoint: { x: canvasX, y: canvasY },
        };
      });
    },
    [activeTool]
  );

  // Finish the current path (Enter key or double-click)
  const finishPath = useCallback(
    (close: boolean = false) => {
      setPenState((prev) => {
        if (!prev.isDrawing || !prev.currentPath) return prev;

        if (prev.currentPath.points.length >= 2) {
          // Schedule element creation for after this render
          pendingPathRef.current = { path: prev.currentPath, closed: close };
        }

        return {
          isDrawing: false,
          currentPath: null,
          previewPoint: null,
        };
      });
    },
    []
  );

  // Cancel the current path (Escape key)
  const cancelPath = useCallback(() => {
    setPenState({
      isDrawing: false,
      currentPath: null,
      previewPoint: null,
    });
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool !== "pen") return;

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        cancelPath();
        setActiveTool("select");
      }

      if (e.key === "Enter") {
        e.preventDefault();
        finishPath(e.shiftKey); // Shift+Enter to close
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, cancelPath, finishPath, setActiveTool]);

  // Cancel path when switching away from pen tool
  useEffect(() => {
    // Only run when tool changes from pen to something else
    if (previousToolRef.current === "pen" && activeTool !== "pen") {
      if (penState.isDrawing && penState.currentPath && penState.currentPath.points.length >= 2) {
        // Schedule element creation for after this render
        pendingPathRef.current = { path: penState.currentPath, closed: false };
      }
      // Schedule state update for next tick
      queueMicrotask(() => {
        setPenState({
          isDrawing: false,
          currentPath: null,
          previewPoint: null,
        });
      });
    }
    previousToolRef.current = activeTool;
  }, [activeTool, penState.isDrawing, penState.currentPath]);

  return {
    penState,
    handleCanvasClick,
    handleMouseMove,
    finishPath,
    cancelPath,
  };
}

// =============================================================================
// PEN TOOL PREVIEW OVERLAY (SVG)
// =============================================================================

interface PenToolOverlayProps {
  penState: PenToolState;
  zoom: number;
}

export function PenToolOverlay({ penState, zoom }: PenToolOverlayProps) {
  const { isDrawing, currentPath, previewPoint } = penState;

  if (!isDrawing || !currentPath) return null;

  const { points } = currentPath;
  const firstAnchor = getFirstAnchor(currentPath);
  const lastPoint = points[points.length - 1];

  // Check if preview point is near first anchor (for close indicator)
  let isNearStart = false;
  if (previewPoint && firstAnchor && points.length > 2) {
    const distance = Math.sqrt(
      Math.pow(previewPoint.x - firstAnchor.x, 2) +
      Math.pow(previewPoint.y - firstAnchor.y, 2)
    );
    isNearStart = distance < CLOSE_THRESHOLD / zoom;
  }

  // Size adjustments for zoom
  const pointRadius = 4 / zoom;
  const strokeWidth = 2 / zoom;
  const previewStrokeWidth = 1 / zoom;

  return (
    <g className="pen-tool-overlay">
      {/* Existing path */}
      {currentPath.d && (
        <path
          d={currentPath.d}
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Preview line from last point to cursor */}
      {previewPoint && lastPoint && (
        <line
          x1={lastPoint.x}
          y1={lastPoint.y}
          x2={isNearStart && firstAnchor ? firstAnchor.x : previewPoint.x}
          y2={isNearStart && firstAnchor ? firstAnchor.y : previewPoint.y}
          stroke="rgb(99, 102, 241)"
          strokeWidth={previewStrokeWidth}
          strokeDasharray={`${4 / zoom},${4 / zoom}`}
          opacity={0.7}
        />
      )}

      {/* Anchor points */}
      {points.map((point, index) => {
        if (point.type === "Z") return null;

        const isFirst = index === 0;

        return (
          <g key={index}>
            {/* Anchor point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill={isFirst ? "rgb(99, 102, 241)" : "white"}
              stroke="rgb(99, 102, 241)"
              strokeWidth={strokeWidth}
            />

            {/* Highlight first point when hovering near it */}
            {isFirst && isNearStart && (
              <circle
                cx={point.x}
                cy={point.y}
                r={pointRadius * 2}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth={previewStrokeWidth}
                opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* Preview point at cursor */}
      {previewPoint && !isNearStart && (
        <circle
          cx={previewPoint.x}
          cy={previewPoint.y}
          r={pointRadius * 0.75}
          fill="rgb(99, 102, 241)"
          opacity={0.5}
        />
      )}
    </g>
  );
}

// =============================================================================
// TOOL SWITCHER COMPONENT
// =============================================================================

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, shortcut, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={`
        flex items-center justify-center w-8 h-8 rounded transition-colors
        ${isActive
          ? "bg-accent text-white"
          : "text-text-secondary hover:bg-surface2 hover:text-text-primary"
        }
      `}
    >
      {icon}
    </button>
  );
}

// Export for use in toolbar
export { ToolButton };

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import {
  PathData,
  PathPoint,
  Point,
  moveTo,
  lineTo,
  curveTo,
  updatePathString,
  getPathBoundingBox,
  getFirstAnchor,
  getLastAnchor,
} from "@/lib/path-utils";

// =============================================================================
// TYPES
// =============================================================================

interface DragInfo {
  isDragging: boolean;
  anchorX: number;
  anchorY: number;
  isInitialPoint: boolean;
}

export interface PenToolState {
  isDrawing: boolean;
  currentPath: PathData | null;
  previewPoint: Point | null;
  dragInfo: DragInfo | null;
  activeHandle: Point | null;
  mirrorHandle: Point | null;
  outgoingHandle: Point | null;
  // Angle constraint state
  isShiftHeld: boolean;
  constrainedPreview: Point | null;
}

interface UsePenToolReturn {
  penState: PenToolState;
  handleMouseDown: (canvasX: number, canvasY: number, e: React.MouseEvent) => void;
  handleMouseMove: (canvasX: number, canvasY: number, e: React.MouseEvent) => void;
  handleMouseUp: (canvasX: number, canvasY: number, e: React.MouseEvent) => void;
  handleDoubleClick: (canvasX: number, canvasY: number) => void;
  finishPath: (close?: boolean) => void;
  cancelPath: () => void;
  deleteLastPoint: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CLOSE_THRESHOLD = 12;
const DRAG_THRESHOLD = 3;
const ANGLE_SNAP_THRESHOLD = 5; // degrees

// Angles to snap to (in degrees)
const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];

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
// HELPERS
// =============================================================================

function getMirrorPoint(anchor: Point, handle: Point): Point {
  return {
    x: anchor.x - (handle.x - anchor.x),
    y: anchor.y - (handle.y - anchor.y),
  };
}

function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

/**
 * Constrain a point to snap to 45-degree angle increments from an origin
 */
function constrainToAngle(origin: Point, target: Point): Point {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return target;
  
  // Get angle in degrees (0 = right, 90 = down)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Find nearest snap angle
  let nearestAngle = SNAP_ANGLES[0];
  let minDiff = Math.abs(angle - nearestAngle);
  
  for (const snapAngle of SNAP_ANGLES) {
    // Handle wrap-around for negative angles
    const diff = Math.min(
      Math.abs(angle - snapAngle),
      Math.abs(angle - snapAngle + 360),
      Math.abs(angle - snapAngle - 360)
    );
    if (diff < minDiff) {
      minDiff = diff;
      nearestAngle = snapAngle;
    }
  }
  
  // Convert back to radians and calculate new point
  const snappedRad = nearestAngle * (Math.PI / 180);
  return {
    x: origin.x + Math.cos(snappedRad) * distance,
    y: origin.y + Math.sin(snappedRad) * distance,
  };
}

/**
 * Get angle between two points in degrees
 */
function getAngle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

const INITIAL_STATE: PenToolState = {
  isDrawing: false,
  currentPath: null,
  previewPoint: null,
  dragInfo: null,
  activeHandle: null,
  mirrorHandle: null,
  outgoingHandle: null,
  isShiftHeld: false,
  constrainedPreview: null,
};

// =============================================================================
// PEN TOOL HOOK
// =============================================================================

export function usePenTool(): UsePenToolReturn {
  const { activeTool, addElement, selectElement, setActiveTool, zoom } = useCanvasStore();
  const [penState, setPenState] = useState<PenToolState>(INITIAL_STATE);
  
  const currentColorRef = useRef(getRandomPathColor());
  const previousToolRef = useRef(activeTool);
  const pendingPathRef = useRef<{ path: PathData; closed: boolean } | null>(null);
  const lastClickTimeRef = useRef(0);

  // Create element from path
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
        pathData: { ...path, closed },
      });

      selectElement(elementId, false);
    },
    [addElement, selectElement]
  );

  // Process pending path after render
  useEffect(() => {
    if (pendingPathRef.current) {
      const { path, closed } = pendingPathRef.current;
      pendingPathRef.current = null;
      finishPathInternal(path, closed);
    }
  });

  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setPenState(prev => ({ ...prev, isShiftHeld: true }));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setPenState(prev => ({ ...prev, isShiftHeld: false, constrainedPreview: null }));
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Mouse down handler
  const handleMouseDown = useCallback(
    (canvasX: number, canvasY: number, e: React.MouseEvent) => {
      if (activeTool !== "pen" || e.button !== 0) return;

      setPenState((prev) => {
        let clickPoint = { x: canvasX, y: canvasY };
        
        // Apply angle constraint if shift is held and we have a reference point
        if (prev.isShiftHeld && prev.isDrawing && prev.currentPath) {
          const lastAnchor = getLastAnchor(prev.currentPath);
          if (lastAnchor) {
            clickPoint = constrainToAngle(lastAnchor, clickPoint);
          }
        }

        // Start new path
        if (!prev.isDrawing || !prev.currentPath) {
          currentColorRef.current = getRandomPathColor();
          return {
            ...INITIAL_STATE,
            isDrawing: true,
            isShiftHeld: prev.isShiftHeld,
            currentPath: updatePathString({
              points: [moveTo(clickPoint.x, clickPoint.y)],
              closed: false,
            }),
            dragInfo: { 
              isDragging: true, 
              anchorX: clickPoint.x, 
              anchorY: clickPoint.y,
              isInitialPoint: true,
            },
          };
        }

        // Check for closing path
        const firstAnchor = getFirstAnchor(prev.currentPath);
        if (firstAnchor && prev.currentPath.points.length > 2) {
          if (dist(clickPoint, firstAnchor) < CLOSE_THRESHOLD / zoom) {
            return {
              ...prev,
              dragInfo: { 
                isDragging: true, 
                anchorX: firstAnchor.x, 
                anchorY: firstAnchor.y,
                isInitialPoint: false,
              },
              activeHandle: null,
              mirrorHandle: null,
            };
          }
        }

        // Start placing new point
        return {
          ...prev,
          dragInfo: { 
            isDragging: true, 
            anchorX: clickPoint.x, 
            anchorY: clickPoint.y,
            isInitialPoint: false,
          },
          activeHandle: null,
          mirrorHandle: null,
        };
      });
    },
    [activeTool, zoom]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (canvasX: number, canvasY: number, e: React.MouseEvent) => {
      if (activeTool !== "pen") return;

      const isShift = e.shiftKey;

      setPenState((prev) => {
        if (!prev.isDrawing) return { ...prev, isShiftHeld: isShift };

        let targetPoint = { x: canvasX, y: canvasY };
        let constrainedPoint: Point | null = null;

        // If dragging (creating handles)
        if (prev.dragInfo?.isDragging) {
          const anchor = { x: prev.dragInfo.anchorX, y: prev.dragInfo.anchorY };
          
          // Constrain handle angle if shift held
          if (isShift) {
            targetPoint = constrainToAngle(anchor, targetPoint);
            constrainedPoint = targetPoint;
          }
          
          const handle = targetPoint;
          const mirror = getMirrorPoint(anchor, handle);

          return {
            ...prev,
            isShiftHeld: isShift,
            activeHandle: handle,
            mirrorHandle: mirror,
            previewPoint: targetPoint,
            constrainedPreview: constrainedPoint,
          };
        }

        // Preview mode - constrain to angle from last anchor
        if (isShift && prev.currentPath) {
          const lastAnchor = getLastAnchor(prev.currentPath);
          if (lastAnchor) {
            targetPoint = constrainToAngle(lastAnchor, targetPoint);
            constrainedPoint = targetPoint;
          }
        }

        return { 
          ...prev, 
          isShiftHeld: isShift,
          previewPoint: { x: canvasX, y: canvasY },
          constrainedPreview: constrainedPoint,
        };
      });
    },
    [activeTool]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(
    (canvasX: number, canvasY: number, e: React.MouseEvent) => {
      if (activeTool !== "pen") return;

      const isShift = e.shiftKey;

      setPenState((prev) => {
        if (!prev.dragInfo?.isDragging || !prev.currentPath) {
          return { ...prev, dragInfo: null, activeHandle: null, mirrorHandle: null };
        }

        const anchor = { x: prev.dragInfo.anchorX, y: prev.dragInfo.anchorY };
        let cursor = { x: canvasX, y: canvasY };
        
        // Apply angle constraint to handle
        if (isShift) {
          cursor = constrainToAngle(anchor, cursor);
        }
        
        const dragDistance = dist(anchor, cursor);
        const wasDragged = dragDistance > DRAG_THRESHOLD / zoom;

        // Initial point - just set outgoing handle
        if (prev.dragInfo.isInitialPoint) {
          return {
            ...prev,
            dragInfo: null,
            activeHandle: null,
            mirrorHandle: null,
            outgoingHandle: wasDragged ? cursor : null,
          };
        }

        // Check if closing
        const firstAnchor = getFirstAnchor(prev.currentPath);
        const isClosing =
          firstAnchor &&
          prev.currentPath.points.length > 2 &&
          dist(anchor, firstAnchor) < CLOSE_THRESHOLD / zoom;

        if (isClosing && firstAnchor) {
          let closedPath = prev.currentPath;
          const points = closedPath.points;

          if (prev.outgoingHandle) {
            const cp1 = prev.outgoingHandle;
            const cp2 = wasDragged ? getMirrorPoint(firstAnchor, cursor) : firstAnchor;
            closedPath = {
              ...closedPath,
              points: [...points, curveTo(firstAnchor.x, firstAnchor.y, cp1.x, cp1.y, cp2.x, cp2.y, "smooth")],
              closed: true,
            };
          } else {
            closedPath = {
              ...closedPath,
              points: [...points, lineTo(firstAnchor.x, firstAnchor.y)],
              closed: true,
            };
          }

          pendingPathRef.current = { path: updatePathString(closedPath), closed: true };
          return { ...INITIAL_STATE, isShiftHeld: isShift };
        }

        // Add new point
        const points = prev.currentPath.points;
        let newPoint: PathPoint;
        let newOutgoing: Point | null = null;

        if (prev.outgoingHandle) {
          const cp1 = prev.outgoingHandle;
          if (wasDragged) {
            const cp2 = getMirrorPoint(anchor, cursor);
            newPoint = curveTo(anchor.x, anchor.y, cp1.x, cp1.y, cp2.x, cp2.y, "smooth");
            newOutgoing = cursor;
          } else {
            newPoint = curveTo(anchor.x, anchor.y, cp1.x, cp1.y, anchor.x, anchor.y, "corner");
            newOutgoing = null;
          }
        } else {
          newPoint = lineTo(anchor.x, anchor.y);
          newOutgoing = wasDragged ? cursor : null;
        }

        return {
          ...prev,
          currentPath: updatePathString({
            ...prev.currentPath,
            points: [...points, newPoint],
          }),
          dragInfo: null,
          activeHandle: null,
          mirrorHandle: null,
          outgoingHandle: newOutgoing,
        };
      });
    },
    [activeTool, zoom]
  );

  // Double-click to finish path
  const handleDoubleClick = useCallback(
    (canvasX: number, canvasY: number) => {
      if (activeTool !== "pen") return;

      setPenState((prev) => {
        if (!prev.isDrawing || !prev.currentPath || prev.currentPath.points.length < 2) {
          return prev;
        }

        // Check if double-clicking near first point to close
        const firstAnchor = getFirstAnchor(prev.currentPath);
        if (firstAnchor && prev.currentPath.points.length > 2) {
          if (dist({ x: canvasX, y: canvasY }, firstAnchor) < CLOSE_THRESHOLD / zoom) {
            pendingPathRef.current = { path: prev.currentPath, closed: true };
            return INITIAL_STATE;
          }
        }

        // Otherwise just finish as open path
        pendingPathRef.current = { path: prev.currentPath, closed: false };
        return INITIAL_STATE;
      });
    },
    [activeTool, zoom]
  );

  // Finish path
  const finishPath = useCallback((close = false) => {
    setPenState((prev) => {
      if (!prev.isDrawing || !prev.currentPath || prev.currentPath.points.length < 2) {
        return INITIAL_STATE;
      }
      pendingPathRef.current = { path: prev.currentPath, closed: close };
      return INITIAL_STATE;
    });
  }, []);

  // Cancel path
  const cancelPath = useCallback(() => {
    setPenState(INITIAL_STATE);
  }, []);

  // Delete last point (Backspace while drawing)
  const deleteLastPoint = useCallback(() => {
    setPenState((prev) => {
      if (!prev.isDrawing || !prev.currentPath || prev.currentPath.points.length <= 1) {
        // If only one point or less, cancel the path
        return INITIAL_STATE;
      }

      const points = prev.currentPath.points;
      const newPoints = points.slice(0, -1);

      return {
        ...prev,
        currentPath: updatePathString({
          ...prev.currentPath,
          points: newPoints,
        }),
        outgoingHandle: null, // Reset outgoing handle when deleting
      };
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool !== "pen") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        e.preventDefault();
        cancelPath();
        setActiveTool("select");
      }
      if (e.key === "Enter") {
        e.preventDefault();
        finishPath(e.shiftKey);
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        if (penState.isDrawing) {
          e.preventDefault();
          deleteLastPoint();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, cancelPath, finishPath, deleteLastPoint, setActiveTool, penState.isDrawing]);

  // Handle tool change
  useEffect(() => {
    if (previousToolRef.current === "pen" && activeTool !== "pen") {
      if (penState.isDrawing && penState.currentPath && penState.currentPath.points.length >= 2) {
        pendingPathRef.current = { path: penState.currentPath, closed: false };
      }
      queueMicrotask(() => setPenState(INITIAL_STATE));
    }
    previousToolRef.current = activeTool;
  }, [activeTool, penState.isDrawing, penState.currentPath]);

  return {
    penState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    finishPath,
    cancelPath,
    deleteLastPoint,
  };
}

// =============================================================================
// PEN TOOL OVERLAY
// =============================================================================

interface PenToolOverlayProps {
  penState: PenToolState;
  zoom: number;
}

export function PenToolOverlay({ penState, zoom }: PenToolOverlayProps) {
  const { 
    isDrawing, 
    currentPath, 
    previewPoint, 
    dragInfo, 
    activeHandle, 
    mirrorHandle, 
    outgoingHandle,
    isShiftHeld,
    constrainedPreview,
  } = penState;

  if (!isDrawing || !currentPath) return null;

  const { points } = currentPath;
  const firstAnchor = getFirstAnchor(currentPath);
  const lastAnchor = getLastAnchor(currentPath);

  // Use constrained preview if shift is held
  const effectivePreview = constrainedPreview || previewPoint;
  
  // Check if near start for close indicator
  const checkPoint = dragInfo?.isDragging && !dragInfo.isInitialPoint
    ? { x: dragInfo.anchorX, y: dragInfo.anchorY } 
    : effectivePreview;
    
  const isNearStart =
    checkPoint && firstAnchor && points.length > 2 && dist(checkPoint, firstAnchor) < CLOSE_THRESHOLD / zoom;

  // Sizes
  const pointRadius = 4 / zoom;
  const handleRadius = 3 / zoom;
  const strokeWidth = 2 / zoom;
  const thinStroke = 1 / zoom;

  // Preview curve path
  let previewPath = "";
  if (effectivePreview && lastAnchor && outgoingHandle && !dragInfo?.isDragging) {
    const target = isNearStart && firstAnchor ? firstAnchor : effectivePreview;
    previewPath = `M ${lastAnchor.x} ${lastAnchor.y} C ${outgoingHandle.x} ${outgoingHandle.y} ${target.x} ${target.y} ${target.x} ${target.y}`;
  }

  return (
    <g className="pen-tool-overlay">
      {/* Existing committed path */}
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

      {/* Preview curve */}
      {previewPath && (
        <path
          d={previewPath}
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth={thinStroke}
          strokeDasharray={`${4 / zoom},${4 / zoom}`}
          opacity={0.7}
        />
      )}

      {/* Preview line (no outgoing handle) */}
      {effectivePreview && lastAnchor && !outgoingHandle && !dragInfo?.isDragging && (
        <line
          x1={lastAnchor.x}
          y1={lastAnchor.y}
          x2={isNearStart && firstAnchor ? firstAnchor.x : effectivePreview.x}
          y2={isNearStart && firstAnchor ? firstAnchor.y : effectivePreview.y}
          stroke="rgb(99, 102, 241)"
          strokeWidth={thinStroke}
          strokeDasharray={`${4 / zoom},${4 / zoom}`}
          opacity={0.7}
        />
      )}

      {/* Angle constraint guide line (when shift held) */}
      {isShiftHeld && constrainedPreview && lastAnchor && !dragInfo?.isDragging && (
        <line
          x1={lastAnchor.x}
          y1={lastAnchor.y}
          x2={constrainedPreview.x}
          y2={constrainedPreview.y}
          stroke="rgb(234, 179, 8)"
          strokeWidth={thinStroke}
          opacity={0.5}
        />
      )}

      {/* Dragging handles */}
      {dragInfo?.isDragging && activeHandle && mirrorHandle && (
        <g>
          <line
            x1={mirrorHandle.x}
            y1={mirrorHandle.y}
            x2={activeHandle.x}
            y2={activeHandle.y}
            stroke={isShiftHeld ? "rgb(234, 179, 8)" : "rgb(99, 102, 241)"}
            strokeWidth={thinStroke}
            opacity={0.8}
          />
          <circle 
            cx={activeHandle.x} 
            cy={activeHandle.y} 
            r={handleRadius} 
            fill={isShiftHeld ? "rgb(234, 179, 8)" : "rgb(99, 102, 241)"} 
            stroke="white" 
            strokeWidth={thinStroke} 
          />
          <circle 
            cx={mirrorHandle.x} 
            cy={mirrorHandle.y} 
            r={handleRadius} 
            fill={isShiftHeld ? "rgb(234, 179, 8)" : "rgb(99, 102, 241)"} 
            stroke="white" 
            strokeWidth={thinStroke} 
          />
        </g>
      )}

      {/* Outgoing handle from last point */}
      {outgoingHandle && lastAnchor && !dragInfo?.isDragging && (
        <g>
          <line
            x1={lastAnchor.x}
            y1={lastAnchor.y}
            x2={outgoingHandle.x}
            y2={outgoingHandle.y}
            stroke="rgb(99, 102, 241)"
            strokeWidth={thinStroke}
            opacity={0.6}
          />
          <circle cx={outgoingHandle.x} cy={outgoingHandle.y} r={handleRadius} fill="rgb(99, 102, 241)" stroke="white" strokeWidth={thinStroke} />
        </g>
      )}

      {/* Anchor points and curve handles */}
      {points.map((point, i) => {
        if (point.type === "Z") return null;
        const isFirst = i === 0;

        return (
          <g key={i}>
            {/* Curve control points */}
            {point.type === "C" && point.cp1 && point.cp2 && (
              <>
                {i > 0 && (
                  <line x1={points[i - 1].x} y1={points[i - 1].y} x2={point.cp1.x} y2={point.cp1.y} stroke="rgb(99, 102, 241)" strokeWidth={thinStroke} opacity={0.4} />
                )}
                <line x1={point.cp2.x} y1={point.cp2.y} x2={point.x} y2={point.y} stroke="rgb(99, 102, 241)" strokeWidth={thinStroke} opacity={0.4} />
                <circle cx={point.cp1.x} cy={point.cp1.y} r={handleRadius * 0.8} fill="white" stroke="rgb(99, 102, 241)" strokeWidth={thinStroke} opacity={0.6} />
                <circle cx={point.cp2.x} cy={point.cp2.y} r={handleRadius * 0.8} fill="white" stroke="rgb(99, 102, 241)" strokeWidth={thinStroke} opacity={0.6} />
              </>
            )}

            {/* Anchor point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill={isFirst ? "rgb(99, 102, 241)" : "white"}
              stroke="rgb(99, 102, 241)"
              strokeWidth={strokeWidth}
            />

            {/* Close indicator */}
            {isFirst && isNearStart && (
              <>
                <circle cx={point.x} cy={point.y} r={pointRadius * 2} fill="none" stroke="rgb(99, 102, 241)" strokeWidth={thinStroke} opacity={0.5} />
                <circle cx={point.x} cy={point.y} r={pointRadius * 2.5} fill="none" stroke="rgb(34, 197, 94)" strokeWidth={thinStroke * 2} opacity={0.8} />
              </>
            )}
          </g>
        );
      })}

      {/* Current drag anchor */}
      {dragInfo?.isDragging && !dragInfo.isInitialPoint && (
        <circle cx={dragInfo.anchorX} cy={dragInfo.anchorY} r={pointRadius} fill="rgb(99, 102, 241)" stroke="white" strokeWidth={strokeWidth} />
      )}

      {/* Preview cursor point */}
      {effectivePreview && !isNearStart && !dragInfo?.isDragging && (
        <circle 
          cx={effectivePreview.x} 
          cy={effectivePreview.y} 
          r={pointRadius * 0.75} 
          fill={isShiftHeld ? "rgb(234, 179, 8)" : "rgb(99, 102, 241)"} 
          opacity={0.5} 
        />
      )}

      {/* Point count indicator */}
      {points.length > 0 && (
        <text
          x={points[0].x}
          y={points[0].y - 20 / zoom}
          fontSize={11 / zoom}
          fill="rgb(99, 102, 241)"
          textAnchor="middle"
          opacity={0.7}
        >
          {points.length} {points.length === 1 ? 'point' : 'points'}
        </text>
      )}
    </g>
  );
}

// =============================================================================
// TOOL BUTTON
// =============================================================================

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
}

export function ToolButton({ icon, label, shortcut, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
        isActive ? "bg-accent text-white" : "text-text-secondary hover:bg-surface2 hover:text-text-primary"
      }`}
    >
      {icon}
    </button>
  );
}

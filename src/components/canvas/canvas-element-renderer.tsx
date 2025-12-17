"use client";

import { memo, useState } from "react";
import { CanvasElement } from "@/hooks/use-canvas-store";
import {
  ResizeHandle,
  RESIZE_CURSORS,
  getHandlePositions,
} from "@/lib/resize-utils";
import {
  RotationCorner,
  getRotationHandlePositions,
  ROTATION_CURSOR,
  ROTATION_HANDLE_OFFSET,
} from "@/lib/rotation-utils";

// =============================================================================
// TYPES
// =============================================================================

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onResizeStart?: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onRotateStart?: (e: React.MouseEvent, elementId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CanvasElementRenderer = memo(function CanvasElementRenderer({
  element,
  isSelected,
  zoom,
  onMouseDown,
  onResizeStart,
  onRotateStart,
}: CanvasElementRendererProps) {
  if (!element.visible) return null;

  const { id, type, x, y, width, height, rotation, fill, stroke, strokeWidth, locked } = element;

  // Base styles for all elements
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width,
    height,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: "center center",
    backgroundColor: fill,
    borderColor: stroke,
    borderWidth: strokeWidth,
    borderStyle: "solid",
    cursor: locked ? "not-allowed" : "move",
    userSelect: "none",
  };

  // Render based on type
  const renderElement = () => {
    switch (type) {
      case "ellipse":
        return (
          <div
            style={{
              ...baseStyle,
              borderRadius: "50%",
            }}
            onMouseDown={(e) => onMouseDown(e, id)}
          />
        );

      case "text":
        return (
          <div
            style={{
              ...baseStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: stroke,
            }}
            onMouseDown={(e) => onMouseDown(e, id)}
          >
            {element.name}
          </div>
        );

      case "rectangle":
      case "frame":
      case "image":
      default:
        return (
          <div
            style={{
              ...baseStyle,
              borderRadius: 4,
            }}
            onMouseDown={(e) => onMouseDown(e, id)}
          />
        );
    }
  };

  return (
    <div className="contents">
      {renderElement()}
      
      {/* Selection indicator with resize and rotation handles */}
      {isSelected && (
        <SelectionBox
          x={x}
          y={y}
          width={width}
          height={height}
          rotation={rotation}
          zoom={zoom}
          locked={locked}
          elementId={id}
          onResizeStart={onResizeStart}
          onRotateStart={onRotateStart}
        />
      )}
    </div>
  );
});

// =============================================================================
// SELECTION BOX WITH RESIZE AND ROTATION HANDLES
// =============================================================================

interface SelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zoom: number;
  locked: boolean;
  elementId: string;
  onResizeStart?: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onRotateStart?: (e: React.MouseEvent, elementId: string) => void;
}

function SelectionBox({ 
  x, 
  y, 
  width, 
  height, 
  rotation, 
  zoom,
  locked,
  elementId,
  onResizeStart,
  onRotateStart,
}: SelectionBoxProps) {
  const [isHoveringRotation, setIsHoveringRotation] = useState(false);
  
  // Handle size should appear constant regardless of zoom
  const handleSize = 8 / zoom;
  const halfHandle = handleSize / 2;
  
  // Border width should also be constant
  const borderWidth = 2 / zoom;
  
  // Rotation handle offset (scaled for zoom)
  const rotationOffset = ROTATION_HANDLE_OFFSET / zoom;
  const rotationHandleSize = 12 / zoom;

  // Get resize handle positions
  const resizeHandlePositions = getHandlePositions();
  const resizeHandles: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  // Get rotation handle positions
  const rotationHandles = getRotationHandlePositions(0, 0, width, height, rotationOffset);
  const rotationCorners: RotationCorner[] = ["nw", "ne", "sw", "se"];

  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    if (!locked && onResizeStart) {
      onResizeStart(e, elementId, handle);
    }
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!locked && onRotateStart) {
      onRotateStart(e, elementId);
    }
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      {/* Selection border */}
      <div
        className="absolute bg-transparent"
        style={{
          inset: -borderWidth / 2,
          border: `${borderWidth}px solid #3b82f6`,
          borderRadius: 2 / zoom,
        }}
      />

      {/* Center dot (visible when hovering rotation handles) */}
      {isHoveringRotation && (
        <div
          className="absolute bg-accent rounded-full"
          style={{
            width: 6 / zoom,
            height: 6 / zoom,
            left: width / 2 - 3 / zoom,
            top: height / 2 - 3 / zoom,
          }}
        />
      )}

      {/* Rotation handles (invisible hit areas at corners, outside the element) */}
      {!locked && rotationCorners.map((corner) => {
        const pos = rotationHandles[corner];
        
        return (
          <div
            key={`rotate-${corner}`}
            className="absolute pointer-events-auto"
            style={{
              width: rotationHandleSize,
              height: rotationHandleSize,
              left: pos.x - rotationHandleSize / 2,
              top: pos.y - rotationHandleSize / 2,
              cursor: ROTATION_CURSOR,
              // Debug: uncomment to see rotation handle areas
              // backgroundColor: "rgba(255, 0, 0, 0.2)",
            }}
            onMouseDown={handleRotateMouseDown}
            onMouseEnter={() => setIsHoveringRotation(true)}
            onMouseLeave={() => setIsHoveringRotation(false)}
          />
        );
      })}

      {/* Resize handles */}
      {!locked && resizeHandles.map((handle) => {
        const pos = resizeHandlePositions[handle];
        const cursor = RESIZE_CURSORS[handle];
        
        return (
          <div
            key={handle}
            className="absolute bg-white pointer-events-auto"
            style={{
              width: handleSize,
              height: handleSize,
              left: pos.x * width - halfHandle,
              top: pos.y * height - halfHandle,
              border: `${borderWidth}px solid #3b82f6`,
              borderRadius: 1 / zoom,
              cursor: cursor,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
          />
        );
      })}
    </div>
  );
}

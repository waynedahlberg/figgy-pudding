"use client";

import { memo } from "react";
import { CanvasElement } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CanvasElementRenderer = memo(function CanvasElementRenderer({
  element,
  isSelected,
  onMouseDown,
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
    // Prevent text selection while dragging
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
      
      {/* Selection indicator */}
      {isSelected && (
        <SelectionBox
          x={x}
          y={y}
          width={width}
          height={height}
          rotation={rotation}
        />
      )}
    </div>
  );
});

// =============================================================================
// SELECTION BOX
// =============================================================================

interface SelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

function SelectionBox({ x, y, width, height, rotation }: SelectionBoxProps) {
  // Handle size
  const handleSize = 8;
  const halfHandle = handleSize / 2;

  // Handle positions (relative to element)
  const handles = [
    { id: "nw", cx: 0, cy: 0 },
    { id: "n", cx: width / 2, cy: 0 },
    { id: "ne", cx: width, cy: 0 },
    { id: "e", cx: width, cy: height / 2 },
    { id: "se", cx: width, cy: height },
    { id: "s", cx: width / 2, cy: height },
    { id: "sw", cx: 0, cy: height },
    { id: "w", cx: 0, cy: height / 2 },
  ];

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
        className="absolute inset-0 border-2 border-accent rounded-sm"
        style={{ margin: -1 }}
      />

      {/* Resize handles */}
      {handles.map((handle) => (
        <div
          key={handle.id}
          className="absolute bg-white border-2 border-accent rounded-sm pointer-events-auto cursor-pointer"
          style={{
            width: handleSize,
            height: handleSize,
            left: handle.cx - halfHandle,
            top: handle.cy - halfHandle,
          }}
          // Resize would be handled here in a full implementation
          onMouseDown={(e) => {
            e.stopPropagation();
            console.log(`Resize handle ${handle.id} clicked`);
          }}
        />
      ))}
    </div>
  );
}

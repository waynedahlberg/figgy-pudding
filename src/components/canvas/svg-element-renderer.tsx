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
import { pathToSVGString } from "@/lib/path-utils";

// =============================================================================
// TYPES
// =============================================================================

interface SVGElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onResizeStart?: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onRotateStart?: (e: React.MouseEvent, elementId: string) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const SVGElementRenderer = memo(function SVGElementRenderer({
  element,
  isSelected,
  zoom,
  onMouseDown,
  onResizeStart,
  onRotateStart,
}: SVGElementRendererProps) {
  if (!element.visible) return null;

  const { id, type, x, y, width, height, rotation, fill, stroke, strokeWidth, locked } = element;

  // Calculate center for rotation transform
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const rotationTransform = rotation ? `rotate(${rotation} ${centerX} ${centerY})` : undefined;

  // Cursor style
  const cursor = locked ? "not-allowed" : "move";

  // Render the appropriate SVG element based on type
  const renderElement = () => {
    switch (type) {
      case "ellipse":
        return (
          <ellipse
            cx={x + width / 2}
            cy={y + height / 2}
            rx={width / 2}
            ry={height / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            transform={rotationTransform}
            style={{ cursor }}
            onMouseDown={(e) => onMouseDown(e, id)}
          />
        );

      case "group":
        // Groups render as a dashed rectangle
        return (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            ry={4}
            fill="transparent"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray="5,5"
            transform={rotationTransform}
            style={{ cursor }}
            onMouseDown={(e) => onMouseDown(e, id)}
          />
        );

      case "path":
        // Paths render using their pathData
        if (!element.pathData) {
          return null;
        }
        const pathD = element.pathData.d || pathToSVGString(element.pathData);
        return (
          <path
            d={pathD}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={rotationTransform}
            style={{ cursor }}
            onMouseDown={(e) => onMouseDown(e, id)}
          />
        );

      case "rectangle":
      case "frame":
      case "image":
      default:
        return (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            ry={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            transform={rotationTransform}
            style={{ cursor }}
            onMouseDown={(e) => onMouseDown(e, id)}
          />
        );
    }
  };

  return (
    <g className="canvas-element" data-element-id={id}>
      {renderElement()}
      
      {/* Selection indicator with resize and rotation handles */}
      {isSelected && (
        <SVGSelectionBox
          x={x}
          y={y}
          width={width}
          height={height}
          rotation={rotation}
          zoom={zoom}
          locked={locked}
          elementId={id}
          isGroup={type === "group"}
          onResizeStart={onResizeStart}
          onRotateStart={onRotateStart}
        />
      )}
    </g>
  );
});

// =============================================================================
// SVG SELECTION BOX WITH RESIZE AND ROTATION HANDLES
// =============================================================================

interface SVGSelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zoom: number;
  locked: boolean;
  elementId: string;
  isGroup?: boolean;
  onResizeStart?: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onRotateStart?: (e: React.MouseEvent, elementId: string) => void;
}

function SVGSelectionBox({
  x,
  y,
  width,
  height,
  rotation,
  zoom,
  locked,
  elementId,
  isGroup,
  onResizeStart,
  onRotateStart,
}: SVGSelectionBoxProps) {
  const [isHoveringRotation, setIsHoveringRotation] = useState(false);

  // Handle size should appear constant regardless of zoom
  const handleSize = 8 / zoom;
  const halfHandle = handleSize / 2;

  // Border width should also be constant
  const borderWidth = 2 / zoom;

  // Rotation handle offset (scaled for zoom)
  const rotationOffset = ROTATION_HANDLE_OFFSET / zoom;
  const rotationHandleSize = 12 / zoom;

  // Selection color - different for groups
  const selectionColor = isGroup ? "#8b5cf6" : "#3b82f6";

  // Calculate center for rotation transform
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const rotationTransform = rotation ? `rotate(${rotation} ${centerX} ${centerY})` : undefined;

  // Get resize handle positions
  const resizeHandlePositions = getHandlePositions();
  const resizeHandles: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  // Get rotation handle positions (relative to element, not to 0,0)
  const rotationHandles = getRotationHandlePositions(x, y, width, height, rotationOffset);
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
    <g 
      className="selection-box" 
      transform={rotationTransform}
      style={{ pointerEvents: "none" }}
    >
      {/* Selection border */}
      <rect
        x={x - borderWidth / 2}
        y={y - borderWidth / 2}
        width={width + borderWidth}
        height={height + borderWidth}
        fill="none"
        stroke={selectionColor}
        strokeWidth={borderWidth}
        strokeDasharray={isGroup ? `${5 / zoom},${5 / zoom}` : undefined}
        rx={2 / zoom}
        ry={2 / zoom}
      />

      {/* Center dot (visible when hovering rotation handles) */}
      {isHoveringRotation && (
        <circle
          cx={centerX}
          cy={centerY}
          r={3 / zoom}
          fill={selectionColor}
        />
      )}

      {/* Rotation handles (invisible hit areas at corners, outside the element) */}
      {!locked && rotationCorners.map((corner) => {
        const pos = rotationHandles[corner];

        return (
          <rect
            key={`rotate-${corner}`}
            x={pos.x - rotationHandleSize / 2}
            y={pos.y - rotationHandleSize / 2}
            width={rotationHandleSize}
            height={rotationHandleSize}
            fill="transparent"
            style={{ 
              cursor: ROTATION_CURSOR,
              pointerEvents: "auto",
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
        
        // Calculate absolute position
        const handleX = x + pos.x * width - halfHandle;
        const handleY = y + pos.y * height - halfHandle;

        return (
          <rect
            key={handle}
            x={handleX}
            y={handleY}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke={selectionColor}
            strokeWidth={borderWidth}
            rx={1 / zoom}
            ry={1 / zoom}
            style={{ 
              cursor,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
          />
        );
      })}
    </g>
  );
}

// =============================================================================
// EXPORT UTILITY: Convert element to SVG string
// =============================================================================

export function elementToSVGString(element: CanvasElement): string {
  const { type, x, y, width, height, rotation, fill, stroke, strokeWidth } = element;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const transform = rotation ? ` transform="rotate(${rotation} ${centerX} ${centerY})"` : "";

  switch (type) {
    case "ellipse":
      return `<ellipse cx="${centerX}" cy="${centerY}" rx="${width / 2}" ry="${height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`;

    case "group":
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" ry="4" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="5,5"${transform}/>`;

    case "path":
      if (!element.pathData) return "";
      const pathD = element.pathData.d || pathToSVGString(element.pathData);
      return `<path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${transform}/>`;

    case "rectangle":
    case "frame":
    case "image":
    default:
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" ry="4" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`;
  }
}

// =============================================================================
// EXPORT UTILITY: Generate full SVG document
// =============================================================================

export function elementsToSVG(
  elements: CanvasElement[],
  options: {
    padding?: number;
    backgroundColor?: string;
    includeHidden?: boolean;
  } = {}
): string {
  const { padding = 20, backgroundColor, includeHidden = false } = options;

  // Filter visible elements
  const visibleElements = includeHidden 
    ? elements 
    : elements.filter((el) => el.visible);

  if (visibleElements.length === 0) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
  }

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  visibleElements.forEach((el) => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });

  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  // Build SVG content
  const bgRect = backgroundColor 
    ? `<rect width="100%" height="100%" fill="${backgroundColor}"/>`
    : "";

  const elementsSVG = visibleElements
    .map((el) => {
      // Offset element positions
      const offsetElement = { ...el, x: el.x + offsetX, y: el.y + offsetY };
      return elementToSVGString(offsetElement);
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bgRect}
  ${elementsSVG}
</svg>`;
}

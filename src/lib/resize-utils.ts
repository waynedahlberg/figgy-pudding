// =============================================================================
// RESIZE UTILITIES
// =============================================================================
// Handles element resizing with proper center-based scaling for rotated objects
// and rotation-aware cursor display.

// =============================================================================
// TYPES
// =============================================================================

export type ResizeHandle = 
  | "n" | "s" | "e" | "w" 
  | "nw" | "ne" | "sw" | "se";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  minWidth?: number;
  minHeight?: number;
  lockAspectRatio?: boolean;
  aspectRatio?: number | null;
  centerBased?: boolean;
}

// =============================================================================
// CURSOR MAPPINGS
// =============================================================================

// Base cursors for each handle (at 0° rotation)
const BASE_CURSORS: Record<ResizeHandle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
};

// All resize cursors in clockwise order (every 45°)
const CURSOR_SEQUENCE = [
  "ns-resize",    // 0° - N/S
  "nesw-resize",  // 45° - NE/SW
  "ew-resize",    // 90° - E/W
  "nwse-resize",  // 135° - NW/SE
  "ns-resize",    // 180° - N/S
  "nesw-resize",  // 225° - NE/SW
  "ew-resize",    // 270° - E/W
  "nwse-resize",  // 315° - NW/SE
];

// Base angle for each handle (clockwise from top)
const HANDLE_BASE_ANGLES: Record<ResizeHandle, number> = {
  n: 0,
  ne: 45,
  e: 90,
  se: 135,
  s: 180,
  sw: 225,
  w: 270,
  nw: 315,
};

// Legacy export for backward compatibility (non-rotated cursors)
export const RESIZE_CURSORS: Record<ResizeHandle, string> = BASE_CURSORS;

/**
 * Get the appropriate cursor for a resize handle, accounting for element rotation.
 * The cursor rotates with the element so it always indicates the actual resize direction.
 */
export function getRotatedCursor(handle: ResizeHandle, rotation: number): string {
  // Normalize rotation to 0-360
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  
  // Get base angle for this handle
  const baseAngle = HANDLE_BASE_ANGLES[handle];
  
  // Add rotation to get effective angle
  const effectiveAngle = (baseAngle + normalizedRotation) % 360;
  
  // Find which cursor index this maps to (every 45°)
  // Add 22.5 to round to nearest 45° increment
  const cursorIndex = Math.round(effectiveAngle / 45) % 8;
  
  return CURSOR_SEQUENCE[cursorIndex];
}

// =============================================================================
// HANDLE POSITIONS
// =============================================================================

export interface HandlePosition {
  x: number; // 0 to 1 (left to right)
  y: number; // 0 to 1 (top to bottom)
}

const HANDLE_POSITIONS: Record<ResizeHandle, HandlePosition> = {
  nw: { x: 0, y: 0 },
  n: { x: 0.5, y: 0 },
  ne: { x: 1, y: 0 },
  e: { x: 1, y: 0.5 },
  se: { x: 1, y: 1 },
  s: { x: 0.5, y: 1 },
  sw: { x: 0, y: 1 },
  w: { x: 0, y: 0.5 },
};

export function getHandlePositions(): Record<ResizeHandle, HandlePosition> {
  return HANDLE_POSITIONS;
}

export function getHandlePosition(handle: ResizeHandle): HandlePosition {
  return HANDLE_POSITIONS[handle];
}

// =============================================================================
// RESIZE CALCULATION
// =============================================================================

/**
 * Calculate new bounds after a resize operation.
 * 
 * For rotated objects, scaling is always performed from the center to maintain
 * visual consistency. For non-rotated objects, edge handles scale from the 
 * opposite edge while corner handles scale from the opposite corner.
 */
export function calculateResize(
  handle: ResizeHandle,
  startBounds: Bounds,
  deltaX: number,
  deltaY: number,
  options: ResizeOptions = {}
): Bounds {
  const {
    minWidth = 10,
    minHeight = 10,
    lockAspectRatio = false,
    aspectRatio = null,
    centerBased = false,
  } = options;

  const { x, y, width, height } = startBounds;
  const originalCenterX = x + width / 2;
  const originalCenterY = y + height / 2;

  // Calculate new dimensions based on handle
  let newWidth = width;
  let newHeight = height;
  let newX = x;
  let newY = y;

  if (centerBased) {
    // Center-based scaling (for rotated objects)
    // The element scales symmetrically around its center
    switch (handle) {
      case "e":
        newWidth = Math.max(minWidth, width + deltaX * 2);
        break;
      case "w":
        newWidth = Math.max(minWidth, width - deltaX * 2);
        break;
      case "s":
        newHeight = Math.max(minHeight, height + deltaY * 2);
        break;
      case "n":
        newHeight = Math.max(minHeight, height - deltaY * 2);
        break;
      case "se":
        newWidth = Math.max(minWidth, width + deltaX * 2);
        newHeight = Math.max(minHeight, height + deltaY * 2);
        break;
      case "sw":
        newWidth = Math.max(minWidth, width - deltaX * 2);
        newHeight = Math.max(minHeight, height + deltaY * 2);
        break;
      case "ne":
        newWidth = Math.max(minWidth, width + deltaX * 2);
        newHeight = Math.max(minHeight, height - deltaY * 2);
        break;
      case "nw":
        newWidth = Math.max(minWidth, width - deltaX * 2);
        newHeight = Math.max(minHeight, height - deltaY * 2);
        break;
    }

    // Maintain center position
    newX = originalCenterX - newWidth / 2;
    newY = originalCenterY - newHeight / 2;
  } else {
    // Edge-based scaling (for non-rotated objects)
    // The opposite edge/corner stays fixed
    switch (handle) {
      case "e":
        newWidth = Math.max(minWidth, width + deltaX);
        break;
      case "w":
        newWidth = Math.max(minWidth, width - deltaX);
        newX = x + width - newWidth;
        break;
      case "s":
        newHeight = Math.max(minHeight, height + deltaY);
        break;
      case "n":
        newHeight = Math.max(minHeight, height - deltaY);
        newY = y + height - newHeight;
        break;
      case "se":
        newWidth = Math.max(minWidth, width + deltaX);
        newHeight = Math.max(minHeight, height + deltaY);
        break;
      case "sw":
        newWidth = Math.max(minWidth, width - deltaX);
        newX = x + width - newWidth;
        newHeight = Math.max(minHeight, height + deltaY);
        break;
      case "ne":
        newWidth = Math.max(minWidth, width + deltaX);
        newHeight = Math.max(minHeight, height - deltaY);
        newY = y + height - newHeight;
        break;
      case "nw":
        newWidth = Math.max(minWidth, width - deltaX);
        newX = x + width - newWidth;
        newHeight = Math.max(minHeight, height - deltaY);
        newY = y + height - newHeight;
        break;
    }
  }

  // Apply aspect ratio locking if requested
  if (lockAspectRatio && aspectRatio) {
    const currentRatio = newWidth / newHeight;
    
    if (handle === "n" || handle === "s") {
      // Vertical resize - adjust width to match
      newWidth = newHeight * aspectRatio;
      if (centerBased) {
        newX = originalCenterX - newWidth / 2;
      }
    } else if (handle === "e" || handle === "w") {
      // Horizontal resize - adjust height to match
      newHeight = newWidth / aspectRatio;
      if (centerBased) {
        newY = originalCenterY - newHeight / 2;
      }
    } else {
      // Corner resize - use the dimension that changed more
      const widthChange = Math.abs(newWidth - width);
      const heightChange = Math.abs(newHeight - height);
      
      if (widthChange > heightChange) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
      
      if (centerBased) {
        newX = originalCenterX - newWidth / 2;
        newY = originalCenterY - newHeight / 2;
      } else {
        // Adjust position for edge-based scaling
        if (handle.includes("w")) {
          newX = x + width - newWidth;
        }
        if (handle.includes("n")) {
          newY = y + height - newHeight;
        }
      }
    }
  }

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Transform delta coordinates from screen space to local (rotated) space.
 * This is needed when resizing rotated objects to ensure the drag direction
 * matches the visual handle position.
 */
export function transformDeltaForRotation(
  deltaX: number,
  deltaY: number,
  rotation: number
): { dx: number; dy: number } {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(-radians);
  const sin = Math.sin(-radians);
  
  return {
    dx: deltaX * cos - deltaY * sin,
    dy: deltaX * sin + deltaY * cos,
  };
}

// =============================================================================
// ALL HANDLES LIST
// =============================================================================

export const ALL_RESIZE_HANDLES: ResizeHandle[] = [
  "nw", "n", "ne", "e", "se", "s", "sw", "w"
];

export const CORNER_HANDLES: ResizeHandle[] = ["nw", "ne", "se", "sw"];
export const EDGE_HANDLES: ResizeHandle[] = ["n", "e", "s", "w"];

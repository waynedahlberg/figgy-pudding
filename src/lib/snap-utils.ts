// =============================================================================
// SNAP UTILITIES
// =============================================================================
// Grid snapping and alignment utilities.

// =============================================================================
// GRID SNAPPING
// =============================================================================

/**
 * Snap a value to the nearest grid increment.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap both x and y coordinates to grid.
 */
export function snapPointToGrid(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

// =============================================================================
// RESIZE SNAPPING
// =============================================================================

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Apply grid snapping to resize bounds.
 * Snaps edges to grid while maintaining minimum dimensions.
 */
export function applySnapToResize(
  bounds: Bounds,
  gridSize: number,
  minWidth: number = 10,
  minHeight: number = 10
): Bounds {
  const snappedX = snapToGrid(bounds.x, gridSize);
  const snappedY = snapToGrid(bounds.y, gridSize);
  const snappedRight = snapToGrid(bounds.x + bounds.width, gridSize);
  const snappedBottom = snapToGrid(bounds.y + bounds.height, gridSize);

  let width = snappedRight - snappedX;
  let height = snappedBottom - snappedY;

  // Ensure minimum dimensions
  if (width < minWidth) {
    width = Math.max(minWidth, Math.ceil(minWidth / gridSize) * gridSize);
  }
  if (height < minHeight) {
    height = Math.max(minHeight, Math.ceil(minHeight / gridSize) * gridSize);
  }

  return {
    x: snappedX,
    y: snappedY,
    width,
    height,
  };
}

// =============================================================================
// SMART GUIDES (Future Enhancement)
// =============================================================================

export interface SnapGuide {
  type: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
}

/**
 * Find snap guides for an element against other elements.
 * Returns potential snap positions for alignment.
 */
export function findSnapGuides(
  movingBounds: Bounds,
  otherBounds: Bounds[],
  threshold: number = 5
): SnapGuide[] {
  const guides: SnapGuide[] = [];
  
  const movingEdges = {
    left: movingBounds.x,
    right: movingBounds.x + movingBounds.width,
    top: movingBounds.y,
    bottom: movingBounds.y + movingBounds.height,
    centerX: movingBounds.x + movingBounds.width / 2,
    centerY: movingBounds.y + movingBounds.height / 2,
  };

  for (const other of otherBounds) {
    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      top: other.y,
      bottom: other.y + other.height,
      centerX: other.x + other.width / 2,
      centerY: other.y + other.height / 2,
    };

    // Check vertical alignments (left, center, right)
    const verticalPairs = [
      [movingEdges.left, otherEdges.left],
      [movingEdges.left, otherEdges.right],
      [movingEdges.right, otherEdges.left],
      [movingEdges.right, otherEdges.right],
      [movingEdges.centerX, otherEdges.centerX],
    ];

    for (const [moving, target] of verticalPairs) {
      if (Math.abs(moving - target) <= threshold) {
        guides.push({
          type: "vertical",
          position: target,
          start: Math.min(movingBounds.y, other.y),
          end: Math.max(movingBounds.y + movingBounds.height, other.y + other.height),
        });
      }
    }

    // Check horizontal alignments (top, center, bottom)
    const horizontalPairs = [
      [movingEdges.top, otherEdges.top],
      [movingEdges.top, otherEdges.bottom],
      [movingEdges.bottom, otherEdges.top],
      [movingEdges.bottom, otherEdges.bottom],
      [movingEdges.centerY, otherEdges.centerY],
    ];

    for (const [moving, target] of horizontalPairs) {
      if (Math.abs(moving - target) <= threshold) {
        guides.push({
          type: "horizontal",
          position: target,
          start: Math.min(movingBounds.x, other.x),
          end: Math.max(movingBounds.x + movingBounds.width, other.x + other.width),
        });
      }
    }
  }

  return guides;
}

// =============================================================================
// SNAP UTILITIES
// =============================================================================
// Math helpers for snapping element positions to a grid:
// - Snap to grid on move/resize
// - Configurable grid size
// - Only affects new transformations, not existing positions

/**
 * Snap a value to the nearest grid line.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position (x, y) to the grid.
 */
export function snapPositionToGrid(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

/**
 * Snap element bounds to grid.
 * Position snaps to grid, dimensions snap to grid increments.
 */
export function snapBoundsToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  gridSize: number
): { x: number; y: number; width: number; height: number } {
  const snappedX = snapToGrid(x, gridSize);
  const snappedY = snapToGrid(y, gridSize);
  
  // For dimensions, snap to nearest grid increment but ensure minimum size
  const snappedWidth = Math.max(gridSize, snapToGrid(width, gridSize));
  const snappedHeight = Math.max(gridSize, snapToGrid(height, gridSize));
  
  return {
    x: snappedX,
    y: snappedY,
    width: snappedWidth,
    height: snappedHeight,
  };
}

/**
 * Calculate snapped position delta.
 * Used when moving elements - snaps the resulting position, not the delta.
 */
export function calculateSnappedMoveDelta(
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  gridSize: number,
  snapEnabled: boolean
): { x: number; y: number } {
  const newX = startX + deltaX;
  const newY = startY + deltaY;
  
  if (!snapEnabled) {
    return { x: newX, y: newY };
  }
  
  return snapPositionToGrid(newX, newY, gridSize);
}

/**
 * Apply snapping to resize bounds.
 */
export function applySnapToResize(
  bounds: { x: number; y: number; width: number; height: number },
  gridSize: number,
  snapEnabled: boolean
): { x: number; y: number; width: number; height: number } {
  if (!snapEnabled) {
    return bounds;
  }
  
  return snapBoundsToGrid(bounds.x, bounds.y, bounds.width, bounds.height, gridSize);
}

// =============================================================================
// SMART SNAPPING (Future enhancement)
// =============================================================================

/**
 * Snap threshold - how close a value needs to be to snap (in canvas units).
 * Used for smart snapping to other elements' edges/centers.
 */
export const SNAP_THRESHOLD = 5;

/**
 * Check if a value is within snap threshold of a target.
 */
export function isWithinSnapThreshold(
  value: number,
  target: number,
  threshold: number = SNAP_THRESHOLD
): boolean {
  return Math.abs(value - target) <= threshold;
}

/**
 * Find the nearest snap point from a list of candidates.
 * Returns the snapped value if within threshold, otherwise the original value.
 */
export function findNearestSnapPoint(
  value: number,
  candidates: number[],
  threshold: number = SNAP_THRESHOLD
): { value: number; snapped: boolean; snapTarget: number | null } {
  let nearestDistance = Infinity;
  let nearestTarget: number | null = null;
  
  for (const candidate of candidates) {
    const distance = Math.abs(value - candidate);
    if (distance <= threshold && distance < nearestDistance) {
      nearestDistance = distance;
      nearestTarget = candidate;
    }
  }
  
  if (nearestTarget !== null) {
    return { value: nearestTarget, snapped: true, snapTarget: nearestTarget };
  }
  
  return { value, snapped: false, snapTarget: null };
}

// =============================================================================
// GRID VISUALIZATION HELPERS
// =============================================================================

/**
 * Calculate grid lines that should be visible in the viewport.
 * Useful for rendering major grid lines differently.
 */
export function getVisibleGridLines(
  viewportWidth: number,
  viewportHeight: number,
  panX: number,
  panY: number,
  zoom: number,
  gridSize: number
): { 
  vertical: number[]; 
  horizontal: number[];
  majorVertical: number[];
  majorHorizontal: number[];
} {
  const scaledGridSize = gridSize * zoom;
  const majorGridMultiple = 5; // Every 5th line is a major line
  
  // Calculate visible range in canvas coordinates
  const startX = -panX / zoom;
  const endX = (viewportWidth - panX) / zoom;
  const startY = -panY / zoom;
  const endY = (viewportHeight - panY) / zoom;
  
  // Find first grid line
  const firstX = Math.floor(startX / gridSize) * gridSize;
  const firstY = Math.floor(startY / gridSize) * gridSize;
  
  const vertical: number[] = [];
  const horizontal: number[] = [];
  const majorVertical: number[] = [];
  const majorHorizontal: number[] = [];
  
  // Generate vertical lines
  for (let x = firstX; x <= endX; x += gridSize) {
    vertical.push(x);
    if (x % (gridSize * majorGridMultiple) === 0) {
      majorVertical.push(x);
    }
  }
  
  // Generate horizontal lines
  for (let y = firstY; y <= endY; y += gridSize) {
    horizontal.push(y);
    if (y % (gridSize * majorGridMultiple) === 0) {
      majorHorizontal.push(y);
    }
  }
  
  return { vertical, horizontal, majorVertical, majorHorizontal };
}

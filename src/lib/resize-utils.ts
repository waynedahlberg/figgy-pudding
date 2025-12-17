// =============================================================================
// RESIZE UTILITIES
// =============================================================================
// Math helpers for resizing elements on a canvas with support for:
// - 8 resize handles (corners + edges)
// - Aspect ratio locking (shift key)
// - Minimum size constraints
// - Zoom-aware calculations

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'w'
  | 'e'
  | 'sw'
  | 's'
  | 'se';

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number | null; // width / height, null = no constraint
  lockAspectRatio?: boolean;
}

const DEFAULT_OPTIONS: Required<ResizeOptions> = {
  minWidth: 10,
  minHeight: 10,
  aspectRatio: null,
  lockAspectRatio: false,
};

// =============================================================================
// CURSOR MAPPING
// =============================================================================

/**
 * Maps resize handles to CSS cursor values.
 * These are the standard cursors for resize operations.
 */
export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

/**
 * Get the cursor for a resize handle, accounting for element rotation.
 * As the element rotates, the visual direction of the handle changes,
 * so the cursor should rotate with it.
 */
export function getRotatedCursor(
  handle: ResizeHandle,
  rotation: number
): string {
  // Normalize rotation to 0-360
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  // Each 45-degree rotation shifts the cursor by one position
  const cursorOrder: ResizeHandle[] = [
    'n',
    'ne',
    'e',
    'se',
    's',
    'sw',
    'w',
    'nw',
  ];
  const currentIndex = cursorOrder.indexOf(handle);

  // Calculate how many positions to shift (each 45° = 1 shift)
  const shift = Math.round(normalizedRotation / 45) % 8;
  const newIndex = (currentIndex + shift) % 8;

  return RESIZE_CURSORS[cursorOrder[newIndex]];
}

// =============================================================================
// HANDLE POSITIONS
// =============================================================================

/**
 * Calculate the position of each resize handle relative to the element.
 * Returns positions as fractions (0-1) of element dimensions.
 */
export function getHandlePositions(): Record<
  ResizeHandle,
  { x: number; y: number }
> {
  return {
    nw: { x: 0, y: 0 },
    n: { x: 0.5, y: 0 },
    ne: { x: 1, y: 0 },
    e: { x: 1, y: 0.5 },
    se: { x: 1, y: 1 },
    s: { x: 0.5, y: 1 },
    sw: { x: 0, y: 1 },
    w: { x: 0, y: 0.5 },
  };
}

/**
 * Calculate the pixel position of a handle for an element.
 */
export function getHandlePixelPosition(
  handle: ResizeHandle,
  bounds: ElementBounds
): { x: number; y: number } {
  const positions = getHandlePositions();
  const pos = positions[handle];
  return {
    x: bounds.x + bounds.width * pos.x,
    y: bounds.y + bounds.height * pos.y,
  };
}

// =============================================================================
// RESIZE CALCULATION
// =============================================================================

/**
 * Calculate new element bounds after a resize operation.
 *
 * @param handle - Which handle is being dragged
 * @param startBounds - Element bounds when drag started
 * @param deltaX - Mouse movement in X (canvas coordinates)
 * @param deltaY - Mouse movement in Y (canvas coordinates)
 * @param options - Resize constraints
 * @returns New element bounds
 */
export function calculateResize(
  handle: ResizeHandle,
  startBounds: ElementBounds,
  deltaX: number,
  deltaY: number,
  options: ResizeOptions = {}
): ResizeResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let { x, y, width, height } = startBounds;

  // Determine which edges are affected by this handle
  const affectsLeft = handle.includes('w');
  const affectsRight = handle.includes('e');
  const affectsTop = handle.includes('n');
  const affectsBottom = handle.includes('s');

  // Calculate new dimensions based on handle
  if (affectsRight) {
    width = Math.max(opts.minWidth, startBounds.width + deltaX);
  }
  if (affectsLeft) {
    const newWidth = Math.max(
      opts.minWidth,
      startBounds.width - deltaX
    );
    const widthDiff = newWidth - startBounds.width;
    x = startBounds.x - widthDiff;
    width = newWidth;
  }
  if (affectsBottom) {
    height = Math.max(opts.minHeight, startBounds.height + deltaY);
  }
  if (affectsTop) {
    const newHeight = Math.max(
      opts.minHeight,
      startBounds.height - deltaY
    );
    const heightDiff = newHeight - startBounds.height;
    y = startBounds.y - heightDiff;
    height = newHeight;
  }

  // Apply aspect ratio constraint if requested
  if (opts.lockAspectRatio && opts.aspectRatio) {
    const result = applyAspectRatio(
      handle,
      { x, y, width, height },
      startBounds,
      opts.aspectRatio,
      opts.minWidth,
      opts.minHeight
    );
    x = result.x;
    y = result.y;
    width = result.width;
    height = result.height;
  }

  return { x, y, width, height };
}

/**
 * Apply aspect ratio constraint to resize result.
 */
function applyAspectRatio(
  handle: ResizeHandle,
  current: ElementBounds,
  start: ElementBounds,
  aspectRatio: number,
  minWidth: number,
  minHeight: number
): ResizeResult {
  let { x, y, width, height } = current;

  // For corner handles, use the larger dimension change
  if (
    handle === 'nw' ||
    handle === 'ne' ||
    handle === 'sw' ||
    handle === 'se'
  ) {
    const widthChange = Math.abs(width - start.width);
    const heightChange = Math.abs(height - start.height);

    if (widthChange > heightChange) {
      // Width is dominant, adjust height
      height = Math.max(minHeight, width / aspectRatio);
    } else {
      // Height is dominant, adjust width
      width = Math.max(minWidth, height * aspectRatio);
    }
  } else if (handle === 'n' || handle === 's') {
    // Vertical handle: adjust width to match
    width = Math.max(minWidth, height * aspectRatio);
  } else {
    // Horizontal handle: adjust height to match
    height = Math.max(minHeight, width / aspectRatio);
  }

  // Adjust position based on handle to keep the opposite corner fixed
  if (handle.includes('w')) {
    x = start.x + start.width - width;
  }
  if (handle.includes('n')) {
    y = start.y + start.height - height;
  }

  // Center adjustment for edge handles
  if (handle === 'n' || handle === 's') {
    x = start.x + (start.width - width) / 2;
  }
  if (handle === 'e' || handle === 'w') {
    y = start.y + (start.height - height) / 2;
  }

  return { x, y, width, height };
}

// =============================================================================
// HIT TESTING
// =============================================================================

/**
 * Check if a point is within a resize handle's hit area.
 *
 * @param point - Point to test (canvas coordinates)
 * @param handle - Handle to test against
 * @param bounds - Element bounds
 * @param handleSize - Size of handle hit area (in canvas units)
 * @returns true if point is within handle
 */
export function isPointInHandle(
  point: { x: number; y: number },
  handle: ResizeHandle,
  bounds: ElementBounds,
  handleSize: number = 8
): boolean {
  const handlePos = getHandlePixelPosition(handle, bounds);
  const halfSize = handleSize / 2;

  return (
    point.x >= handlePos.x - halfSize &&
    point.x <= handlePos.x + halfSize &&
    point.y >= handlePos.y - halfSize &&
    point.y <= handlePos.y + halfSize
  );
}

/**
 * Find which resize handle (if any) is at a given point.
 *
 * @param point - Point to test (canvas coordinates)
 * @param bounds - Element bounds
 * @param handleSize - Size of handle hit area
 * @returns The handle at the point, or null if none
 */
export function getHandleAtPoint(
  point: { x: number; y: number },
  bounds: ElementBounds,
  handleSize: number = 8
): ResizeHandle | null {
  const handles: ResizeHandle[] = [
    'nw',
    'n',
    'ne',
    'e',
    'se',
    's',
    'sw',
    'w',
  ];

  for (const handle of handles) {
    if (isPointInHandle(point, handle, bounds, handleSize)) {
      return handle;
    }
  }

  return null;
}

// =============================================================================
// VISUAL HANDLE DIMENSIONS
// =============================================================================

/**
 * Get the visual size for resize handles based on zoom level.
 * Handles should appear the same size on screen regardless of zoom.
 */
export function getHandleVisualSize(
  zoom: number,
  baseSize: number = 8
): number {
  return baseSize / zoom;
}

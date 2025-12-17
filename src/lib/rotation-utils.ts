// =============================================================================
// ROTATION UTILITIES
// =============================================================================
// Math helpers for rotating elements on a canvas:
// - Rotation around center point
// - Angle calculation from mouse position
// - Rotation handle hit detection
// - Cursor rotation based on element angle

/**
 * Calculate the angle (in degrees) from a center point to a target point.
 * Returns angle in range 0-360, where 0 is pointing right (east).
 */
export function calculateAngle(
  centerX: number,
  centerY: number,
  targetX: number,
  targetY: number
): number {
  const deltaX = targetX - centerX;
  const deltaY = targetY - centerY;
  
  // atan2 returns radians from -PI to PI, where 0 is pointing right
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  
  // Convert to 0-360 range
  if (angle < 0) {
    angle += 360;
  }
  
  return angle;
}

/**
 * Calculate the rotation delta from start angle to current angle.
 * Handles wrapping around 0/360 boundary.
 */
export function calculateRotationDelta(
  startAngle: number,
  currentAngle: number
): number {
  let delta = currentAngle - startAngle;
  
  // Handle wraparound (e.g., going from 350° to 10° should be +20°, not -340°)
  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }
  
  return delta;
}

/**
 * Normalize an angle to the range 0-360.
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Snap angle to nearest increment (e.g., 15° or 45°).
 * Used when shift key is held for constrained rotation.
 */
export function snapAngle(angle: number, increment: number = 15): number {
  return Math.round(angle / increment) * increment;
}

/**
 * Get the center point of an element.
 */
export function getElementCenter(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
}

// =============================================================================
// ROTATION HANDLE POSITIONING
// =============================================================================

/**
 * Rotation handle offset from corner (in canvas units).
 * The handle appears diagonally outside each corner.
 */
export const ROTATION_HANDLE_OFFSET = 20;

/**
 * Size of the rotation handle hit area.
 */
export const ROTATION_HANDLE_SIZE = 16;

export type RotationCorner = "nw" | "ne" | "sw" | "se";

/**
 * Get the position of rotation handles for each corner.
 * Handles are positioned diagonally outside the bounding box corners.
 */
export function getRotationHandlePositions(
  x: number,
  y: number,
  width: number,
  height: number,
  offset: number = ROTATION_HANDLE_OFFSET
): Record<RotationCorner, { x: number; y: number }> {
  // Calculate diagonal offset (45 degrees from corner)
  const diagonalOffset = offset / Math.sqrt(2);
  
  return {
    nw: { x: x - diagonalOffset, y: y - diagonalOffset },
    ne: { x: x + width + diagonalOffset, y: y - diagonalOffset },
    sw: { x: x - diagonalOffset, y: y + height + diagonalOffset },
    se: { x: x + width + diagonalOffset, y: y + height + diagonalOffset },
  };
}

/**
 * Check if a point is within a rotation handle's hit area.
 */
export function isPointInRotationHandle(
  pointX: number,
  pointY: number,
  handleX: number,
  handleY: number,
  handleSize: number = ROTATION_HANDLE_SIZE
): boolean {
  const halfSize = handleSize / 2;
  return (
    pointX >= handleX - halfSize &&
    pointX <= handleX + halfSize &&
    pointY >= handleY - halfSize &&
    pointY <= handleY + halfSize
  );
}

/**
 * Find which rotation handle (if any) is at a given point.
 */
export function getRotationHandleAtPoint(
  pointX: number,
  pointY: number,
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  handleOffset: number = ROTATION_HANDLE_OFFSET,
  handleSize: number = ROTATION_HANDLE_SIZE
): RotationCorner | null {
  const handles = getRotationHandlePositions(
    elementX,
    elementY,
    elementWidth,
    elementHeight,
    handleOffset
  );
  
  const corners: RotationCorner[] = ["nw", "ne", "sw", "se"];
  
  for (const corner of corners) {
    const handle = handles[corner];
    if (isPointInRotationHandle(pointX, pointY, handle.x, handle.y, handleSize)) {
      return corner;
    }
  }
  
  return null;
}

// =============================================================================
// ROTATION CURSOR
// =============================================================================

/**
 * CSS for a custom rotation cursor.
 * This creates a curved arrow with a white outline for visibility on any background.
 * Similar to Figma's rotation cursor style.
 */
export const ROTATION_CURSOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- White outline/stroke for contrast -->
  <path d="M21 12a9 9 0 1 1-9-9" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="21 3 21 9 15 9" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Black inner stroke -->
  <path d="M21 12a9 9 0 1 1-9-9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="21 3 21 9 15 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/**
 * Get a data URL for the rotation cursor.
 */
export function getRotationCursorUrl(): string {
  const encoded = encodeURIComponent(ROTATION_CURSOR_SVG.trim());
  return `url("data:image/svg+xml,${encoded}") 12 12, pointer`;
}

/**
 * Precomputed rotation cursor CSS value.
 */
export const ROTATION_CURSOR = getRotationCursorUrl();

// =============================================================================
// ROTATION TRANSFORMATION
// =============================================================================

/**
 * Apply rotation to a point around a center.
 * Useful for transforming coordinates of rotated elements.
 */
export function rotatePoint(
  pointX: number,
  pointY: number,
  centerX: number,
  centerY: number,
  angleDegrees: number
): { x: number; y: number } {
  const angleRadians = angleDegrees * (Math.PI / 180);
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  // Translate point to origin
  const translatedX = pointX - centerX;
  const translatedY = pointY - centerY;
  
  // Rotate
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  
  // Translate back
  return {
    x: rotatedX + centerX,
    y: rotatedY + centerY,
  };
}

/**
 * Get the bounding box of a rotated rectangle.
 * Returns the axis-aligned bounding box that contains the rotated element.
 */
export function getRotatedBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): { x: number; y: number; width: number; height: number } {
  if (rotation === 0) {
    return { x, y, width, height };
  }
  
  const center = getElementCenter(x, y, width, height);
  
  // Get the four corners
  const corners = [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + height },
    { x: x, y: y + height },
  ];
  
  // Rotate each corner
  const rotatedCorners = corners.map((corner) =>
    rotatePoint(corner.x, corner.y, center.x, center.y, rotation)
  );
  
  // Find bounding box
  const xs = rotatedCorners.map((c) => c.x);
  const ys = rotatedCorners.map((c) => c.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
// =============================================================================
// ROTATION UTILITIES
// =============================================================================
// Handles element rotation calculations and related utilities.

// =============================================================================
// TYPES
// =============================================================================

export type RotationCorner = "nw" | "ne" | "se" | "sw";

export interface Point {
  x: number;
  y: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const ROTATION_CURSOR = "grab";
export const ROTATION_HANDLE_OFFSET = 20; // Distance from corner to rotation handle

// Common snap angles
export const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
export const SNAP_THRESHOLD = 5; // Degrees within which to snap

// =============================================================================
// ANGLE CALCULATIONS
// =============================================================================

/**
 * Calculate angle in degrees from center to point.
 * Returns angle in range [-180, 180] where 0 is pointing right.
 * 
 * Can be called with:
 * - Two Points: calculateAngle(center, point)
 * - Four numbers: calculateAngle(centerX, centerY, pointX, pointY)
 */
export function calculateAngle(
  centerOrCenterX: Point | number,
  pointOrCenterY: Point | number,
  pointX?: number,
  pointY?: number
): number {
  let cx: number, cy: number, px: number, py: number;
  
  if (typeof centerOrCenterX === 'object') {
    // Point-based signature
    cx = centerOrCenterX.x;
    cy = centerOrCenterX.y;
    px = (pointOrCenterY as Point).x;
    py = (pointOrCenterY as Point).y;
  } else {
    // Number-based signature
    cx = centerOrCenterX;
    cy = pointOrCenterY as number;
    px = pointX!;
    py = pointY!;
  }
  
  const dx = px - cx;
  const dy = py - cy;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate the rotation delta between two angles.
 */
export function calculateRotationDelta(startAngle: number, currentAngle: number): number {
  let delta = currentAngle - startAngle;
  
  // Normalize to [-180, 180]
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  
  return delta;
}

/**
 * Normalize angle to [0, 360) range.
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Snap angle to nearest common angle if within threshold.
 */
export function snapAngle(angle: number, threshold: number = SNAP_THRESHOLD): number {
  const normalized = normalizeAngle(angle);
  
  for (const snapAngle of SNAP_ANGLES) {
    const diff = Math.abs(normalized - snapAngle);
    const wrapDiff = Math.abs(normalized - snapAngle - 360);
    
    if (diff <= threshold || wrapDiff <= threshold) {
      return snapAngle === 360 ? 0 : snapAngle;
    }
  }
  
  return normalized;
}

// =============================================================================
// ELEMENT CENTER
// =============================================================================

/**
 * Get the center point of an element.
 * 
 * Can be called with:
 * - An object: getElementCenter({ x, y, width, height })
 * - Four numbers: getElementCenter(x, y, width, height)
 */
export function getElementCenter(
  elementOrX: { x: number; y: number; width: number; height: number } | number,
  y?: number,
  width?: number,
  height?: number
): Point {
  if (typeof elementOrX === 'object') {
    return {
      x: elementOrX.x + elementOrX.width / 2,
      y: elementOrX.y + elementOrX.height / 2,
    };
  }
  
  return {
    x: elementOrX + width! / 2,
    y: y! + height! / 2,
  };
}

// =============================================================================
// ROTATION HANDLE POSITIONS
// =============================================================================

/**
 * Get positions for rotation handles at each corner.
 * Returns positions offset from the corners for visual clarity.
 * 
 * Can be called with:
 * - Object + offset: getRotationHandlePositions({ x, y, width, height }, offset)
 * - Four numbers + offset: getRotationHandlePositions(x, y, width, height, offset)
 */
export function getRotationHandlePositions(
  boundsOrX: { x: number; y: number; width: number; height: number } | number,
  yOrOffset?: number,
  widthParam?: number,
  heightParam?: number,
  offsetParam?: number
): Record<RotationCorner, Point> {
  let x: number, y: number, width: number, height: number, offset: number;
  
  if (typeof boundsOrX === 'object') {
    x = boundsOrX.x;
    y = boundsOrX.y;
    width = boundsOrX.width;
    height = boundsOrX.height;
    offset = yOrOffset ?? ROTATION_HANDLE_OFFSET;
  } else {
    x = boundsOrX;
    y = yOrOffset!;
    width = widthParam!;
    height = heightParam!;
    offset = offsetParam ?? ROTATION_HANDLE_OFFSET;
  }
  
  // Offset diagonally from each corner
  const diagonalOffset = offset / Math.SQRT2;
  
  return {
    nw: { x: x - diagonalOffset, y: y - diagonalOffset },
    ne: { x: x + width + diagonalOffset, y: y - diagonalOffset },
    se: { x: x + width + diagonalOffset, y: y + height + diagonalOffset },
    sw: { x: x - diagonalOffset, y: y + height + diagonalOffset },
  };
}

// =============================================================================
// POINT TRANSFORMATIONS
// =============================================================================

/**
 * Rotate a point around a center by a given angle in degrees.
 */
export function rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
  const radians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Get the four corners of a rotated rectangle.
 */
export function getRotatedCorners(
  bounds: { x: number; y: number; width: number; height: number },
  rotation: number
): { nw: Point; ne: Point; se: Point; sw: Point } {
  const { x, y, width, height } = bounds;
  const center = { x: x + width / 2, y: y + height / 2 };
  
  // Unrotated corners
  const corners = {
    nw: { x, y },
    ne: { x: x + width, y },
    se: { x: x + width, y: y + height },
    sw: { x, y: y + height },
  };
  
  // Rotate each corner
  return {
    nw: rotatePoint(corners.nw, center, rotation),
    ne: rotatePoint(corners.ne, center, rotation),
    se: rotatePoint(corners.se, center, rotation),
    sw: rotatePoint(corners.sw, center, rotation),
  };
}

// =============================================================================
// ROTATION CURSOR
// =============================================================================

/**
 * Get a rotation cursor that indicates the rotation direction.
 * Returns a custom cursor URL or fallback.
 */
export function getRotationCursor(
  corner: RotationCorner,
  currentRotation: number
): string {
  // Base angle for each corner (clockwise from top-left)
  const baseAngles: Record<RotationCorner, number> = {
    nw: -135,
    ne: -45,
    se: 45,
    sw: 135,
  };
  
  // For now, return the default rotation cursor
  // In a production app, you might use custom cursor images
  return ROTATION_CURSOR;
}

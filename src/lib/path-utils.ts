// =============================================================================
// PATH TYPES AND UTILITIES
// =============================================================================
// Core types and functions for working with vector paths and Bézier curves.

// =============================================================================
// TYPES
// =============================================================================

/**
 * A point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Types of path commands
 */
export type PathPointType = "M" | "L" | "C" | "Q" | "Z";

/**
 * A single point/node in a path.
 * 
 * - M (moveTo): Starting point of a subpath
 * - L (lineTo): Straight line to this point
 * - C (curveTo): Cubic Bézier curve with two control points
 * - Q (quadTo): Quadratic Bézier curve with one control point
 * - Z (close): Close the path back to the last M point
 */
export interface PathPoint {
  /** The type of path command */
  type: PathPointType;
  
  /** The anchor point (end point of this segment) */
  x: number;
  y: number;
  
  /** 
   * Control point 1 (for C and Q curves)
   * For cubic (C): This is the first control point (attached to previous anchor)
   * For quadratic (Q): This is the single control point
   */
  cp1?: Point;
  
  /**
   * Control point 2 (for C curves only)
   * This is the second control point (attached to this anchor)
   */
  cp2?: Point;
  
  /**
   * Handle mode for this anchor point.
   * - "smooth": Handles are collinear (smooth curve through point)
   * - "corner": Handles can be at any angle (sharp corner possible)
   * - "symmetric": Handles are collinear and equal length
   */
  handleMode?: "smooth" | "corner" | "symmetric";
}

/**
 * Complete path data structure
 */
export interface PathData {
  /** Array of path points defining the path */
  points: PathPoint[];
  
  /** Whether the path is closed (connects back to start) */
  closed: boolean;
  
  /** Cached SVG path string (d attribute) */
  d?: string;
}

// =============================================================================
// PATH STRING GENERATION
// =============================================================================

/**
 * Generate SVG path d attribute string from PathData
 */
export function pathToSVGString(pathData: PathData): string {
  const { points, closed } = pathData;
  
  if (points.length === 0) return "";
  
  const parts: string[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    
    switch (point.type) {
      case "M":
        parts.push(`M ${point.x} ${point.y}`);
        break;
        
      case "L":
        parts.push(`L ${point.x} ${point.y}`);
        break;
        
      case "C":
        if (point.cp1 && point.cp2) {
          parts.push(`C ${point.cp1.x} ${point.cp1.y} ${point.cp2.x} ${point.cp2.y} ${point.x} ${point.y}`);
        } else {
          // Fallback to line if control points missing
          parts.push(`L ${point.x} ${point.y}`);
        }
        break;
        
      case "Q":
        if (point.cp1) {
          parts.push(`Q ${point.cp1.x} ${point.cp1.y} ${point.x} ${point.y}`);
        } else {
          // Fallback to line if control point missing
          parts.push(`L ${point.x} ${point.y}`);
        }
        break;
        
      case "Z":
        parts.push("Z");
        break;
    }
  }
  
  // Add close command if path is closed but doesn't end with Z
  if (closed && points.length > 0 && points[points.length - 1].type !== "Z") {
    parts.push("Z");
  }
  
  return parts.join(" ");
}

/**
 * Update the cached d string in a PathData object
 */
export function updatePathString(pathData: PathData): PathData {
  return {
    ...pathData,
    d: pathToSVGString(pathData),
  };
}

// =============================================================================
// PATH CREATION HELPERS
// =============================================================================

/**
 * Create a move-to point
 */
export function moveTo(x: number, y: number): PathPoint {
  return { type: "M", x, y };
}

/**
 * Create a line-to point
 */
export function lineTo(x: number, y: number): PathPoint {
  return { type: "L", x, y };
}

/**
 * Create a cubic Bézier curve point
 */
export function curveTo(
  x: number,
  y: number,
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  handleMode: PathPoint["handleMode"] = "smooth"
): PathPoint {
  return {
    type: "C",
    x,
    y,
    cp1: { x: cp1x, y: cp1y },
    cp2: { x: cp2x, y: cp2y },
    handleMode,
  };
}

/**
 * Create a quadratic Bézier curve point
 */
export function quadTo(
  x: number,
  y: number,
  cpx: number,
  cpy: number
): PathPoint {
  return {
    type: "Q",
    x,
    y,
    cp1: { x: cpx, y: cpy },
  };
}

/**
 * Create a close path point
 */
export function closePath(): PathPoint {
  return { type: "Z", x: 0, y: 0 };
}

/**
 * Create an empty path starting at a given point
 */
export function createPath(startX: number, startY: number): PathData {
  return updatePathString({
    points: [moveTo(startX, startY)],
    closed: false,
  });
}

/**
 * Create a simple line path between two points
 */
export function createLinePath(x1: number, y1: number, x2: number, y2: number): PathData {
  return updatePathString({
    points: [moveTo(x1, y1), lineTo(x2, y2)],
    closed: false,
  });
}

/**
 * Create a rectangle as a path
 */
export function createRectanglePath(x: number, y: number, width: number, height: number): PathData {
  return updatePathString({
    points: [
      moveTo(x, y),
      lineTo(x + width, y),
      lineTo(x + width, y + height),
      lineTo(x, y + height),
      closePath(),
    ],
    closed: true,
  });
}

/**
 * Create an ellipse as a path using cubic Bézier curves
 * This uses the standard 4-point Bézier approximation of an ellipse
 */
export function createEllipsePath(cx: number, cy: number, rx: number, ry: number): PathData {
  // Magic number for circular Bézier approximation: 4/3 * (√2 - 1) ≈ 0.5523
  const k = 0.5522847498;
  const kx = k * rx;
  const ky = k * ry;
  
  return updatePathString({
    points: [
      moveTo(cx, cy - ry),                                              // Top
      curveTo(cx + rx, cy, cx + kx, cy - ry, cx + rx, cy - ky),        // Top to Right
      curveTo(cx, cy + ry, cx + rx, cy + ky, cx + kx, cy + ry),        // Right to Bottom
      curveTo(cx - rx, cy, cx - kx, cy + ry, cx - rx, cy + ky),        // Bottom to Left
      curveTo(cx, cy - ry, cx - rx, cy - ky, cx - kx, cy - ry),        // Left to Top
      closePath(),
    ],
    closed: true,
  });
}

// =============================================================================
// PATH MANIPULATION
// =============================================================================

/**
 * Add a point to the end of a path
 */
export function addPointToPath(pathData: PathData, point: PathPoint): PathData {
  return updatePathString({
    ...pathData,
    points: [...pathData.points, point],
  });
}

/**
 * Update a point in a path
 */
export function updatePathPoint(
  pathData: PathData,
  index: number,
  updates: Partial<PathPoint>
): PathData {
  const newPoints = [...pathData.points];
  newPoints[index] = { ...newPoints[index], ...updates };
  return updatePathString({
    ...pathData,
    points: newPoints,
  });
}

/**
 * Remove a point from a path
 */
export function removePathPoint(pathData: PathData, index: number): PathData {
  const newPoints = pathData.points.filter((_, i) => i !== index);
  
  // If we removed the first point (M), make the next point an M
  if (index === 0 && newPoints.length > 0 && newPoints[0].type !== "M") {
    newPoints[0] = { ...newPoints[0], type: "M" };
  }
  
  return updatePathString({
    ...pathData,
    points: newPoints,
  });
}

/**
 * Insert a point into a path at a given index
 */
export function insertPathPoint(pathData: PathData, index: number, point: PathPoint): PathData {
  const newPoints = [...pathData.points];
  newPoints.splice(index, 0, point);
  return updatePathString({
    ...pathData,
    points: newPoints,
  });
}

/**
 * Close an open path
 */
export function closePathData(pathData: PathData): PathData {
  if (pathData.closed) return pathData;
  
  return updatePathString({
    ...pathData,
    closed: true,
  });
}

/**
 * Open a closed path
 */
export function openPathData(pathData: PathData): PathData {
  if (!pathData.closed) return pathData;
  
  // Remove Z point if present
  const points = pathData.points.filter((p) => p.type !== "Z");
  
  return updatePathString({
    ...pathData,
    points,
    closed: false,
  });
}

// =============================================================================
// PATH BOUNDING BOX
// =============================================================================

/**
 * Calculate the bounding box of a path.
 * Note: This is a simplified version that only considers anchor points,
 * not the actual curve extents. For precise bounds, we'd need to calculate
 * the curve extrema.
 */
export function getPathBoundingBox(pathData: PathData): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { points } = pathData;
  
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const point of points) {
    if (point.type === "Z") continue;
    
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    
    // Also consider control points for a better approximation
    if (point.cp1) {
      minX = Math.min(minX, point.cp1.x);
      minY = Math.min(minY, point.cp1.y);
      maxX = Math.max(maxX, point.cp1.x);
      maxY = Math.max(maxY, point.cp1.y);
    }
    if (point.cp2) {
      minX = Math.min(minX, point.cp2.x);
      minY = Math.min(minY, point.cp2.y);
      maxX = Math.max(maxX, point.cp2.x);
      maxY = Math.max(maxY, point.cp2.y);
    }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// =============================================================================
// PATH TRANSFORMATION
// =============================================================================

/**
 * Translate all points in a path by a delta
 */
export function translatePath(pathData: PathData, dx: number, dy: number): PathData {
  const newPoints = pathData.points.map((point) => {
    if (point.type === "Z") return point;
    
    const newPoint: PathPoint = {
      ...point,
      x: point.x + dx,
      y: point.y + dy,
    };
    
    if (point.cp1) {
      newPoint.cp1 = { x: point.cp1.x + dx, y: point.cp1.y + dy };
    }
    if (point.cp2) {
      newPoint.cp2 = { x: point.cp2.x + dx, y: point.cp2.y + dy };
    }
    
    return newPoint;
  });
  
  return updatePathString({
    ...pathData,
    points: newPoints,
  });
}

/**
 * Scale a path around an origin point
 */
export function scalePath(
  pathData: PathData,
  scaleX: number,
  scaleY: number,
  originX: number = 0,
  originY: number = 0
): PathData {
  const newPoints = pathData.points.map((point) => {
    if (point.type === "Z") return point;
    
    const newPoint: PathPoint = {
      ...point,
      x: originX + (point.x - originX) * scaleX,
      y: originY + (point.y - originY) * scaleY,
    };
    
    if (point.cp1) {
      newPoint.cp1 = {
        x: originX + (point.cp1.x - originX) * scaleX,
        y: originY + (point.cp1.y - originY) * scaleY,
      };
    }
    if (point.cp2) {
      newPoint.cp2 = {
        x: originX + (point.cp2.x - originX) * scaleX,
        y: originY + (point.cp2.y - originY) * scaleY,
      };
    }
    
    return newPoint;
  });
  
  return updatePathString({
    ...pathData,
    points: newPoints,
  });
}

/**
 * Rotate a path around an origin point
 */
export function rotatePath(
  pathData: PathData,
  angleDegrees: number,
  originX: number = 0,
  originY: number = 0
): PathData {
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const rotatePoint = (x: number, y: number): Point => {
    const dx = x - originX;
    const dy = y - originY;
    return {
      x: originX + dx * cos - dy * sin,
      y: originY + dx * sin + dy * cos,
    };
  };
  
  const newPoints = pathData.points.map((point) => {
    if (point.type === "Z") return point;
    
    const rotated = rotatePoint(point.x, point.y);
    const newPoint: PathPoint = {
      ...point,
      x: rotated.x,
      y: rotated.y,
    };
    
    if (point.cp1) {
      const rotatedCp1 = rotatePoint(point.cp1.x, point.cp1.y);
      newPoint.cp1 = rotatedCp1;
    }
    if (point.cp2) {
      const rotatedCp2 = rotatePoint(point.cp2.x, point.cp2.y);
      newPoint.cp2 = rotatedCp2;
    }
    
    return newPoint;
  });
  
  return updatePathString({
    ...pathData,
    points: newPoints,
  });
}

// =============================================================================
// UTILITY: GET POINT AT INDEX (handling negative indices)
// =============================================================================

export function getPathPoint(pathData: PathData, index: number): PathPoint | undefined {
  const { points } = pathData;
  if (index < 0) {
    index = points.length + index;
  }
  return points[index];
}

// =============================================================================
// UTILITY: GET FIRST/LAST ANCHOR POINT
// =============================================================================

export function getFirstAnchor(pathData: PathData): Point | undefined {
  const firstPoint = pathData.points.find((p) => p.type === "M");
  return firstPoint ? { x: firstPoint.x, y: firstPoint.y } : undefined;
}

export function getLastAnchor(pathData: PathData): Point | undefined {
  // Find the last non-Z point
  for (let i = pathData.points.length - 1; i >= 0; i--) {
    const point = pathData.points[i];
    if (point.type !== "Z") {
      return { x: point.x, y: point.y };
    }
  }
  return undefined;
}

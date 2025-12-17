// =============================================================================
// PAN & ZOOM UTILITIES
// =============================================================================
// Math helpers for Figma-style canvas navigation:
// - Scroll wheel = pan vertically
// - Shift + scroll wheel = pan horizontally
// - Cmd/Ctrl + scroll wheel = zoom
// - Middle mouse button drag = pan X/Y
// - Space + left mouse drag = pan X/Y
// - Trackpad pinch = zoom (native browser behavior)

export interface PanZoomState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface WheelEventInfo {
  deltaX: number;
  deltaY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  clientX: number;
  clientY: number;
}

export interface PanZoomResult {
  panX: number;
  panY: number;
  zoom: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const MIN_ZOOM = 0.1; // 10%
export const MAX_ZOOM = 4; // 400%
export const ZOOM_LEVELS = [
  0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4,
];

// Pan speed multiplier for scroll wheel
const PAN_SPEED = 1;

// Zoom speed for scroll wheel (how much zoom per pixel of scroll)
const ZOOM_WHEEL_SPEED = 0.005;

// Zoom speed for trackpad pinch (ctrlKey + wheel)
const ZOOM_PINCH_SPEED = 0.01;

// =============================================================================
// WHEEL EVENT HANDLING
// =============================================================================

/**
 * Handle wheel events with Figma-style behavior:
 * - Normal scroll = pan Y
 * - Shift + scroll = pan X
 * - Cmd/Ctrl + scroll = zoom toward cursor
 * - Trackpad pinch (ctrlKey) = zoom toward cursor
 *
 * @param state Current pan/zoom state
 * @param event Wheel event info
 * @param viewportRect Bounding rect of the canvas container
 * @returns New pan/zoom state
 */
export function handleWheelEvent(
  state: PanZoomState,
  event: WheelEventInfo,
  viewportRect: DOMRect
): PanZoomResult {
  const {
    deltaX,
    deltaY,
    ctrlKey,
    metaKey,
    shiftKey,
    clientX,
    clientY,
  } = event;
  let { panX, panY } = state;
  const { zoom } = state;

  // Mouse position relative to viewport
  const mouseX = clientX - viewportRect.left;
  const mouseY = clientY - viewportRect.top;

  // Cmd/Ctrl + scroll OR trackpad pinch (ctrlKey) = zoom
  if (metaKey || ctrlKey) {
    // Use different speed for trackpad pinch vs scroll wheel
    const speed =
      ctrlKey && !metaKey ? ZOOM_PINCH_SPEED : ZOOM_WHEEL_SPEED;
    const zoomDelta = -deltaY * speed;
    const newZoom = clampZoom(zoom * (1 + zoomDelta));

    // Zoom toward cursor position
    const result = zoomToPoint(
      panX,
      panY,
      zoom,
      newZoom,
      mouseX,
      mouseY
    );
    return result;
  }

  // Shift + scroll = pan horizontally
  if (shiftKey) {
    // Use deltaY for horizontal pan when shift is held (more intuitive)
    panX -= deltaY * PAN_SPEED;
    return { panX, panY, zoom };
  }

  // Normal scroll = pan (deltaY for vertical, deltaX for horizontal)
  // This handles both scroll wheel and trackpad two-finger scroll
  panX -= deltaX * PAN_SPEED;
  panY -= deltaY * PAN_SPEED;

  return { panX, panY, zoom };
}

// =============================================================================
// ZOOM HELPERS
// =============================================================================

/**
 * Clamp zoom to valid range
 */
export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Zoom toward a specific point, keeping that point stationary on screen.
 * This is the key formula for natural zoom behavior.
 */
export function zoomToPoint(
  panX: number,
  panY: number,
  oldZoom: number,
  newZoom: number,
  pointX: number,
  pointY: number
): PanZoomResult {
  const clampedZoom = clampZoom(newZoom);

  // Calculate canvas point under the cursor at old zoom
  const canvasX = (pointX - panX) / oldZoom;
  const canvasY = (pointY - panY) / oldZoom;

  // Calculate new pan to keep that canvas point under cursor at new zoom
  const newPanX = pointX - canvasX * clampedZoom;
  const newPanY = pointY - canvasY * clampedZoom;

  return {
    panX: newPanX,
    panY: newPanY,
    zoom: clampedZoom,
  };
}

/**
 * Get the next zoom level up from current zoom
 */
export function getNextZoomIn(currentZoom: number): number {
  const nextLevel = ZOOM_LEVELS.find((level) => level > currentZoom);
  return nextLevel ?? MAX_ZOOM;
}

/**
 * Get the next zoom level down from current zoom
 */
export function getNextZoomOut(currentZoom: number): number {
  const prevLevel = [...ZOOM_LEVELS]
    .reverse()
    .find((level) => level < currentZoom);
  return prevLevel ?? MIN_ZOOM;
}

/**
 * Step zoom in toward a point
 */
export function stepZoomIn(
  panX: number,
  panY: number,
  zoom: number,
  centerX: number,
  centerY: number
): PanZoomResult {
  const newZoom = getNextZoomIn(zoom);
  return zoomToPoint(panX, panY, zoom, newZoom, centerX, centerY);
}

/**
 * Step zoom out from a point
 */
export function stepZoomOut(
  panX: number,
  panY: number,
  zoom: number,
  centerX: number,
  centerY: number
): PanZoomResult {
  const newZoom = getNextZoomOut(zoom);
  return zoomToPoint(panX, panY, zoom, newZoom, centerX, centerY);
}

// =============================================================================
// PAN HELPERS
// =============================================================================

/**
 * Calculate pan delta from mouse drag
 */
export function calculatePanDelta(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  startPanX: number,
  startPanY: number
): { panX: number; panY: number } {
  const deltaX = currentX - startX;
  const deltaY = currentY - startY;

  return {
    panX: startPanX + deltaX,
    panY: startPanY + deltaY,
  };
}

// =============================================================================
// INPUT STATE DETECTION
// =============================================================================

/**
 * Determine the pan mode based on input state
 */
export type PanTrigger = 'space' | 'middle-mouse' | 'none';

export interface InputState {
  isSpacePressed: boolean;
  isMiddleMouseDown: boolean;
  isLeftMouseDown: boolean;
}

export function getPanTrigger(state: InputState): PanTrigger {
  if (state.isMiddleMouseDown) return 'middle-mouse';
  if (state.isSpacePressed && state.isLeftMouseDown) return 'space';
  return 'none';
}

/**
 * Check if we should start panning based on mouse button and input state
 */
export function shouldStartPan(
  mouseButton: number,
  isSpacePressed: boolean
): boolean {
  // Middle mouse button (button 1) always starts pan
  if (mouseButton === 1) return true;

  // Left mouse button (button 0) + space starts pan
  if (mouseButton === 0 && isSpacePressed) return true;

  return false;
}

// =============================================================================
// CURSOR HELPERS
// =============================================================================

export type PanCursor = 'default' | 'grab' | 'grabbing';

/**
 * Get the appropriate cursor for pan state
 */
export function getPanCursor(
  isSpacePressed: boolean,
  isPanning: boolean
): PanCursor {
  if (isPanning) return 'grabbing';
  if (isSpacePressed) return 'grab';
  return 'default';
}

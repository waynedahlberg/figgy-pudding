// =============================================================================
// PAN & ZOOM UTILITIES
// =============================================================================
// Utilities for canvas panning and zooming.

// =============================================================================
// CONSTANTS
// =============================================================================

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 0.1;
export const WHEEL_ZOOM_FACTOR = 0.001;

// =============================================================================
// PAN DETECTION
// =============================================================================

/**
 * Determine if a mouse event should start panning.
 * Pan starts with middle mouse button or space+left click.
 */
export function shouldStartPan(button: number, isSpacePressed: boolean): boolean {
  // Middle mouse button
  if (button === 1) return true;
  
  // Space + left click
  if (button === 0 && isSpacePressed) return true;
  
  return false;
}

// =============================================================================
// PAN CURSOR
// =============================================================================

/**
 * Get the appropriate cursor for pan state.
 */
export function getPanCursor(isSpacePressed: boolean, isPanning: boolean): string {
  if (isPanning) {
    return "grabbing";
  }
  if (isSpacePressed) {
    return "grab";
  }
  return "default";
}

// =============================================================================
// WHEEL ZOOM
// =============================================================================

export interface PanZoomState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface WheelEventData {
  deltaX: number;
  deltaY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  clientX: number;
  clientY: number;
}

/**
 * Handle wheel events for pan/zoom.
 * - Ctrl/Cmd + wheel = zoom (centered on cursor)
 * - Wheel alone = pan
 * - Shift + wheel = horizontal pan
 */
export function handleWheelEvent(
  state: PanZoomState,
  event: WheelEventData,
  containerRect: DOMRect
): PanZoomState {
  const { panX, panY, zoom } = state;
  const { deltaX, deltaY, ctrlKey, metaKey, shiftKey, clientX, clientY } = event;

  // Zoom with Ctrl/Cmd + wheel
  if (ctrlKey || metaKey) {
    // Calculate cursor position relative to container
    const cursorX = clientX - containerRect.left;
    const cursorY = clientY - containerRect.top;

    // Calculate cursor position in canvas space before zoom
    const canvasX = (cursorX - panX) / zoom;
    const canvasY = (cursorY - panY) / zoom;

    // Calculate new zoom level
    const zoomDelta = -deltaY * WHEEL_ZOOM_FACTOR;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 + zoomDelta)));

    // Adjust pan to keep cursor position fixed
    const newPanX = cursorX - canvasX * newZoom;
    const newPanY = cursorY - canvasY * newZoom;

    return {
      panX: newPanX,
      panY: newPanY,
      zoom: newZoom,
    };
  }

  // Pan with wheel
  let newPanX = panX;
  let newPanY = panY;

  if (shiftKey) {
    // Shift + wheel = horizontal pan
    newPanX = panX - deltaY;
  } else {
    // Normal wheel = vertical pan (and horizontal if trackpad)
    newPanX = panX - deltaX;
    newPanY = panY - deltaY;
  }

  return {
    panX: newPanX,
    panY: newPanY,
    zoom,
  };
}

// =============================================================================
// ZOOM TO POINT
// =============================================================================

/**
 * Zoom to a specific level, centered on a point.
 */
export function zoomToPoint(
  state: PanZoomState,
  targetZoom: number,
  centerX: number,
  centerY: number
): PanZoomState {
  const { panX, panY, zoom } = state;

  // Clamp target zoom
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom));

  // Calculate point in canvas space
  const canvasX = (centerX - panX) / zoom;
  const canvasY = (centerY - panY) / zoom;

  // Adjust pan to keep point fixed
  const newPanX = centerX - canvasX * newZoom;
  const newPanY = centerY - canvasY * newZoom;

  return {
    panX: newPanX,
    panY: newPanY,
    zoom: newZoom,
  };
}

// =============================================================================
// FIT TO CONTENT
// =============================================================================

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate pan/zoom to fit content within viewport with padding.
 */
export function fitToContent(
  contentBounds: Bounds,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): PanZoomState {
  const { x, y, width, height } = contentBounds;

  // Available space after padding
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;

  // Calculate zoom to fit
  const zoomX = availableWidth / width;
  const zoomY = availableHeight / height;
  const zoom = Math.min(zoomX, zoomY, MAX_ZOOM);

  // Center content
  const contentCenterX = x + width / 2;
  const contentCenterY = y + height / 2;

  const panX = viewportWidth / 2 - contentCenterX * zoom;
  const panY = viewportHeight / 2 - contentCenterY * zoom;

  return { panX, panY, zoom };
}

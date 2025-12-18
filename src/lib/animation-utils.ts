// =============================================================================
// ANIMATION UTILITIES
// =============================================================================
// Helpers for smooth animated transitions on the canvas:
// - Easing functions
// - Animated value interpolation
// - Zoom animation with pan adjustment

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

/**
 * Standard easing functions for animations.
 * These take a progress value from 0 to 1 and return an eased value.
 */
export const easings = {
  // Linear (no easing)
  linear: (t: number): number => t,

  // Ease out - starts fast, slows down
  easeOut: (t: number): number => 1 - Math.pow(1 - t, 3),

  // Ease in - starts slow, speeds up
  easeIn: (t: number): number => Math.pow(t, 3),

  // Ease in-out - slow start and end
  easeInOut: (t: number): number =>
    t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Ease out quad - gentler ease out
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),

  // Ease out expo - strong ease out (good for zoom)
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

  // Spring-like overshoot
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export type EasingFunction = (t: number) => number;
export type EasingName = keyof typeof easings;

// =============================================================================
// ANIMATION STATE
// =============================================================================

export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  startValue: number;
  endValue: number;
  easing: EasingFunction;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export interface PanZoomAnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  startPanX: number;
  startPanY: number;
  startZoom: number;
  endPanX: number;
  endPanY: number;
  endZoom: number;
  easing: EasingFunction;
}

// =============================================================================
// INTERPOLATION
// =============================================================================

/**
 * Linear interpolation between two values.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get the current animated value based on time elapsed.
 */
export function getAnimatedValue(
  startValue: number,
  endValue: number,
  startTime: number,
  duration: number,
  easing: EasingFunction = easings.easeOutExpo
): { value: number; isComplete: boolean } {
  const now = performance.now();
  const elapsed = now - startTime;
  const progress = Math.min(elapsed / duration, 1);
  const easedProgress = easing(progress);
  const value = lerp(startValue, endValue, easedProgress);

  return {
    value,
    isComplete: progress >= 1,
  };
}

/**
 * Get current animated pan/zoom values.
 */
export function getAnimatedPanZoom(
  state: PanZoomAnimationState
): { panX: number; panY: number; zoom: number; isComplete: boolean } {
  const now = performance.now();
  const elapsed = now - state.startTime;
  const progress = Math.min(elapsed / state.duration, 1);
  const easedProgress = state.easing(progress);

  return {
    panX: lerp(state.startPanX, state.endPanX, easedProgress),
    panY: lerp(state.startPanY, state.endPanY, easedProgress),
    zoom: lerp(state.startZoom, state.endZoom, easedProgress),
    isComplete: progress >= 1,
  };
}

// =============================================================================
// ZOOM ANIMATION CALCULATIONS
// =============================================================================

/**
 * Calculate the target pan position for a zoom animation.
 * This ensures the specified point stays stationary during the zoom.
 */
export function calculateZoomAnimationTarget(
  currentPanX: number,
  currentPanY: number,
  currentZoom: number,
  targetZoom: number,
  centerX: number,
  centerY: number
): { panX: number; panY: number; zoom: number } {
  // Calculate the canvas point under the center
  const canvasX = (centerX - currentPanX) / currentZoom;
  const canvasY = (centerY - currentPanY) / currentZoom;

  // Calculate new pan to keep that point under center at new zoom
  const newPanX = centerX - canvasX * targetZoom;
  const newPanY = centerY - canvasY * targetZoom;

  return {
    panX: newPanX,
    panY: newPanY,
    zoom: targetZoom,
  };
}

/**
 * Calculate target for "fit to screen" or "reset view" animation.
 */
export function calculateResetViewTarget(): { panX: number; panY: number; zoom: number } {
  return {
    panX: 0,
    panY: 0,
    zoom: 1,
  };
}

// =============================================================================
// ANIMATION LOOP HELPER
// =============================================================================

/**
 * Create an animation loop that calls onFrame until complete.
 * Returns a cancel function.
 */
export function createAnimationLoop(
  onFrame: (timestamp: number) => boolean // Return false to stop
): () => void {
  let animationFrameId: number | null = null;
  let cancelled = false;

  const loop = (timestamp: number) => {
    if (cancelled) return;

    const shouldContinue = onFrame(timestamp);

    if (shouldContinue && !cancelled) {
      animationFrameId = requestAnimationFrame(loop);
    }
  };

  animationFrameId = requestAnimationFrame(loop);

  // Return cancel function
  return () => {
    cancelled = true;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

// =============================================================================
// DEFAULT ANIMATION SETTINGS
// =============================================================================

export const ZOOM_ANIMATION_DURATION = 200; // ms
export const RESET_VIEW_ANIMATION_DURATION = 300; // ms
export const DEFAULT_EASING: EasingFunction = easings.easeOutExpo;

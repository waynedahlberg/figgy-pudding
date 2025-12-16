"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// TYPES

interface CanvasState {
  // Pan offset (how far the canvas has been dragged)
  panX: number;
  panY: number;
  // Zoom level (1 = 100%)
  zoom: number;
}

interface CanvasStore extends CanvasState {
  // Actions
  setPan: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  resetView: () => void;
  // Coordinate conversion helpers
  screenToCanvas: (screenX: number, screenY: number, rect: DOMRect) => { x: number; y: number };
  canvasToScreen: (canvasX: number, canvasY: number, rect: DOMRect) => { x: number; y: number };
}

// CONSTANTS

const MIN_ZOOM = 0.1;  // 10%
const MAX_ZOOM = 4;    // 400%

const initialState: CanvasState = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

// CONTEXT

const CanvasContext = createContext<CanvasStore | null>(null);

// PROVIDER

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CanvasState>(initialState);

  // Set pan position
  const setPan = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, panX: x, panY: y }));
  }, []);

  // Set zoom level (clamped to min/max)
  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    setState((prev) => ({ ...prev, zoom: clampedZoom }));
  }, []);

  // Reset to initial view
  const resetView = useCallback(() => {
    setState(initialState);
  }, []);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, rect: DOMRect) => {
      const { panX, panY, zoom } = state;
      return {
        x: (screenX - rect.left - panX) / zoom,
        y: (screenY - rect.top - panY) / zoom,
      };
    },
    [state]
  );

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number, rect: DOMRect) => {
      const { panX, panY, zoom } = state;
      return {
        x: canvasX * zoom + panX + rect.left,
        y: canvasY * zoom + panY + rect.top,
      };
    },
    [state]
  );

  const store: CanvasStore = {
    ...state,
    setPan,
    setZoom,
    resetView,
    screenToCanvas,
    canvasToScreen,
  };

  return (
    <CanvasContext.Provider value={store}>
      {children}
    </CanvasContext.Provider>
  );
}

// HOOK

export function useCanvasStore() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasStore must be used within a CanvasProvider");
  }
  return context;
}
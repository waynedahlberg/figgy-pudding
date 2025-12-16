"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface CanvasElement {
  id: string;
  type: "rectangle" | "ellipse" | "text" | "image" | "frame";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  name: string;
  locked: boolean;
  visible: boolean;
}

interface CanvasState {
  // Viewport
  panX: number;
  panY: number;
  zoom: number;
  // Elements
  elements: CanvasElement[];
  selectedIds: string[];
}

interface CanvasStore extends CanvasState {
  // Viewport actions
  setPan: (x: number, y: number) => void;
  adjustPan: (deltaX: number, deltaY: number) => void;
  setZoom: (zoom: number) => void;
  zoomTo: (newZoom: number, centerX: number, centerY: number) => void;
  zoomIn: (centerX?: number, centerY?: number) => void;
  zoomOut: (centerX?: number, centerY?: number) => void;
  resetView: () => void;
  fitToScreen: () => void;
  // Element actions
  addElement: (element: Omit<CanvasElement, "id">) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElements: (ids: string[]) => void;
  moveElements: (ids: string[], deltaX: number, deltaY: number) => void;
  // Selection actions
  selectElement: (id: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  selectAll: () => void;
  // Helpers
  getSelectedElements: () => CanvasElement[];
  getElementById: (id: string) => CanvasElement | undefined;
  screenToCanvas: (screenX: number, screenY: number, rect: DOMRect) => { x: number; y: number };
  canvasToScreen: (canvasX: number, canvasY: number, rect: DOMRect) => { x: number; y: number };
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

// Default colors for new elements
const ELEMENT_COLORS = [
  { fill: "rgba(99, 102, 241, 0.2)", stroke: "rgb(99, 102, 241)" },   // Indigo
  { fill: "rgba(236, 72, 153, 0.2)", stroke: "rgb(236, 72, 153)" },   // Pink
  { fill: "rgba(34, 197, 94, 0.2)", stroke: "rgb(34, 197, 94)" },     // Green
  { fill: "rgba(249, 115, 22, 0.2)", stroke: "rgb(249, 115, 22)" },   // Orange
  { fill: "rgba(14, 165, 233, 0.2)", stroke: "rgb(14, 165, 233)" },   // Sky
  { fill: "rgba(168, 85, 247, 0.2)", stroke: "rgb(168, 85, 247)" },   // Purple
];

// Initial sample elements
const initialElements: CanvasElement[] = [
  {
    id: "elem-1",
    type: "rectangle",
    x: 50,
    y: 50,
    width: 200,
    height: 150,
    rotation: 0,
    fill: ELEMENT_COLORS[0].fill,
    stroke: ELEMENT_COLORS[0].stroke,
    strokeWidth: 2,
    name: "Header Frame",
    locked: false,
    visible: true,
  },
  {
    id: "elem-2",
    type: "rectangle",
    x: 300,
    y: 100,
    width: 150,
    height: 100,
    rotation: 0,
    fill: ELEMENT_COLORS[1].fill,
    stroke: ELEMENT_COLORS[1].stroke,
    strokeWidth: 2,
    name: "Card",
    locked: false,
    visible: true,
  },
  {
    id: "elem-3",
    type: "ellipse",
    x: -100,
    y: 150,
    width: 120,
    height: 120,
    rotation: 0,
    fill: ELEMENT_COLORS[2].fill,
    stroke: ELEMENT_COLORS[2].stroke,
    strokeWidth: 2,
    name: "Avatar",
    locked: false,
    visible: true,
  },
  {
    id: "elem-4",
    type: "rectangle",
    x: 100,
    y: -120,
    width: 180,
    height: 60,
    rotation: 0,
    fill: ELEMENT_COLORS[3].fill,
    stroke: ELEMENT_COLORS[3].stroke,
    strokeWidth: 2,
    name: "Button",
    locked: false,
    visible: true,
  },
];

const initialState: CanvasState = {
  panX: 0,
  panY: 0,
  zoom: 1,
  elements: initialElements,
  selectedIds: [],
};

// =============================================================================
// CONTEXT
// =============================================================================

const CanvasContext = createContext<CanvasStore | null>(null);

// =============================================================================
// HELPER: Generate unique ID
// =============================================================================

let idCounter = 100;
function generateId(): string {
  return `elem-${++idCounter}`;
}

// =============================================================================
// PROVIDER
// =============================================================================

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CanvasState>(initialState);

  // ---------------------------------------------------------------------------
  // VIEWPORT ACTIONS
  // ---------------------------------------------------------------------------

  const setPan = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, panX: x, panY: y }));
  }, []);

  const adjustPan = useCallback((deltaX: number, deltaY: number) => {
    setState((prev) => ({
      ...prev,
      panX: prev.panX + deltaX,
      panY: prev.panY + deltaY,
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    setState((prev) => ({ ...prev, zoom: clampedZoom }));
  }, []);

  const zoomTo = useCallback((newZoom: number, centerX: number, centerY: number) => {
    setState((prev) => {
      const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      const canvasX = (centerX - prev.panX) / prev.zoom;
      const canvasY = (centerY - prev.panY) / prev.zoom;
      const newPanX = centerX - canvasX * clampedZoom;
      const newPanY = centerY - canvasY * clampedZoom;
      return { ...prev, panX: newPanX, panY: newPanY, zoom: clampedZoom };
    });
  }, []);

  const zoomIn = useCallback((centerX?: number, centerY?: number) => {
    setState((prev) => {
      const nextLevel = ZOOM_LEVELS.find((level) => level > prev.zoom) ?? MAX_ZOOM;
      if (centerX !== undefined && centerY !== undefined) {
        const canvasX = (centerX - prev.panX) / prev.zoom;
        const canvasY = (centerY - prev.panY) / prev.zoom;
        const newPanX = centerX - canvasX * nextLevel;
        const newPanY = centerY - canvasY * nextLevel;
        return { ...prev, panX: newPanX, panY: newPanY, zoom: nextLevel };
      }
      return { ...prev, zoom: nextLevel };
    });
  }, []);

  const zoomOut = useCallback((centerX?: number, centerY?: number) => {
    setState((prev) => {
      const prevLevel = [...ZOOM_LEVELS].reverse().find((level) => level < prev.zoom) ?? MIN_ZOOM;
      if (centerX !== undefined && centerY !== undefined) {
        const canvasX = (centerX - prev.panX) / prev.zoom;
        const canvasY = (centerY - prev.panY) / prev.zoom;
        const newPanX = centerX - canvasX * prevLevel;
        const newPanY = centerY - canvasY * prevLevel;
        return { ...prev, panX: newPanX, panY: newPanY, zoom: prevLevel };
      }
      return { ...prev, zoom: prevLevel };
    });
  }, []);

  const resetView = useCallback(() => {
    setState((prev) => ({ ...prev, panX: 0, panY: 0, zoom: 1 }));
  }, []);

  const fitToScreen = useCallback(() => {
    setState((prev) => ({ ...prev, panX: 0, panY: 0, zoom: 1 }));
  }, []);

  // ---------------------------------------------------------------------------
  // ELEMENT ACTIONS
  // ---------------------------------------------------------------------------

  const addElement = useCallback((element: Omit<CanvasElement, "id">): string => {
    const id = generateId();
    const newElement: CanvasElement = { ...element, id };
    setState((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedIds: [id], // Select the new element
    }));
    return id;
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setState((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  const deleteElements = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => !ids.includes(el.id)),
      selectedIds: prev.selectedIds.filter((id) => !ids.includes(id)),
    }));
  }, []);

  const moveElements = useCallback((ids: string[], deltaX: number, deltaY: number) => {
    setState((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        ids.includes(el.id) && !el.locked
          ? { ...el, x: el.x + deltaX, y: el.y + deltaY }
          : el
      ),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // SELECTION ACTIONS
  // ---------------------------------------------------------------------------

  const selectElement = useCallback((id: string, addToSelection = false) => {
    setState((prev) => {
      if (addToSelection) {
        // Toggle selection when shift-clicking
        const isSelected = prev.selectedIds.includes(id);
        return {
          ...prev,
          selectedIds: isSelected
            ? prev.selectedIds.filter((sid) => sid !== id)
            : [...prev.selectedIds, id],
        };
      }
      // Single select
      return { ...prev, selectedIds: [id] };
    });
  }, []);

  const deselectAll = useCallback(() => {
    setState((prev) => ({ ...prev, selectedIds: [] }));
  }, []);

  const selectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: prev.elements.filter((el) => !el.locked).map((el) => el.id),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const getSelectedElements = useCallback((): CanvasElement[] => {
    return state.elements.filter((el) => state.selectedIds.includes(el.id));
  }, [state.elements, state.selectedIds]);

  const getElementById = useCallback((id: string): CanvasElement | undefined => {
    return state.elements.find((el) => el.id === id);
  }, [state.elements]);

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, rect: DOMRect) => {
      return {
        x: (screenX - rect.left - state.panX) / state.zoom,
        y: (screenY - rect.top - state.panY) / state.zoom,
      };
    },
    [state.panX, state.panY, state.zoom]
  );

  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number, rect: DOMRect) => {
      return {
        x: canvasX * state.zoom + state.panX + rect.left,
        y: canvasY * state.zoom + state.panY + rect.top,
      };
    },
    [state.panX, state.panY, state.zoom]
  );

  // ---------------------------------------------------------------------------
  // STORE
  // ---------------------------------------------------------------------------

  const store: CanvasStore = {
    ...state,
    setPan,
    adjustPan,
    setZoom,
    zoomTo,
    zoomIn,
    zoomOut,
    resetView,
    fitToScreen,
    addElement,
    updateElement,
    deleteElements,
    moveElements,
    selectElement,
    deselectAll,
    selectAll,
    getSelectedElements,
    getElementById,
    screenToCanvas,
    canvasToScreen,
  };

  return (
    <CanvasContext.Provider value={store}>
      {children}
    </CanvasContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useCanvasStore() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasStore must be used within a CanvasProvider");
  }
  return context;
}
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import {
  easings,
  lerp,
  calculateZoomAnimationTarget,
  ZOOM_ANIMATION_DURATION,
  RESET_VIEW_ANIMATION_DURATION,
} from "@/lib/animation-utils";
import {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
} from "@/lib/z-order-utils";
import {
  calculateBoundingBox,
  makePositionsRelative,
  makePositionsAbsolute,
  canGroup,
  canUngroup,
} from "@/lib/group-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface CanvasElement {
  id: string;
  type: "rectangle" | "ellipse" | "text" | "image" | "frame" | "group";
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
  // Group-specific properties
  childIds?: string[];
}

interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  startPanX: number;
  startPanY: number;
  startZoom: number;
  endPanX: number;
  endPanY: number;
  endZoom: number;
}

interface CanvasState {
  // Viewport
  panX: number;
  panY: number;
  zoom: number;
  // Elements
  elements: CanvasElement[];
  selectedIds: string[];
  // Group children storage (childId -> parent group element's children with relative positions)
  groupChildren: Map<string, CanvasElement[]>;
  // Settings
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showRulers: boolean;
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
  // Animated zoom actions
  animateZoomTo: (newZoom: number, centerX: number, centerY: number) => void;
  animateZoomIn: (centerX?: number, centerY?: number) => void;
  animateZoomOut: (centerX?: number, centerY?: number) => void;
  animateResetView: () => void;
  // Element actions
  addElement: (element: Omit<CanvasElement, "id">) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElements: (ids: string[]) => void;
  moveElements: (ids: string[], deltaX: number, deltaY: number) => void;
  // Z-order actions
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  // Group actions
  groupSelected: () => void;
  ungroupSelected: () => void;
  canGroupSelection: () => boolean;
  canUngroupSelection: () => boolean;
  // Selection actions
  selectElement: (id: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  selectAll: () => void;
  // Settings actions
  setSnapToGrid: (enabled: boolean) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  setShowGrid: (show: boolean) => void;
  toggleShowGrid: () => void;
  setShowRulers: (show: boolean) => void;
  toggleShowRulers: () => void;
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
export const DEFAULT_GRID_SIZE = 20;

// Default colors for new elements
const ELEMENT_COLORS = [
  { fill: "rgba(99, 102, 241, 0.2)", stroke: "rgb(99, 102, 241)" },
  { fill: "rgba(236, 72, 153, 0.2)", stroke: "rgb(236, 72, 153)" },
  { fill: "rgba(34, 197, 94, 0.2)", stroke: "rgb(34, 197, 94)" },
  { fill: "rgba(249, 115, 22, 0.2)", stroke: "rgb(249, 115, 22)" },
  { fill: "rgba(14, 165, 233, 0.2)", stroke: "rgb(14, 165, 233)" },
  { fill: "rgba(168, 85, 247, 0.2)", stroke: "rgb(168, 85, 247)" },
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
  groupChildren: new Map(),
  snapToGrid: false,
  gridSize: DEFAULT_GRID_SIZE,
  showGrid: true,
  showRulers: false,
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

  const animationRef = useRef<AnimationState | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationLoopRef = useRef<(() => void) | null>(null);

  // ---------------------------------------------------------------------------
  // ANIMATION LOOP
  // ---------------------------------------------------------------------------

  // Update the animation loop function
  useEffect(() => {
    animationLoopRef.current = () => {
      const anim = animationRef.current;
      if (!anim || !anim.isAnimating) return;

      const now = performance.now();
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = easings.easeOutExpo(progress);

      const currentPanX = lerp(anim.startPanX, anim.endPanX, easedProgress);
      const currentPanY = lerp(anim.startPanY, anim.endPanY, easedProgress);
      const currentZoom = lerp(anim.startZoom, anim.endZoom, easedProgress);

      setState((prev) => ({
        ...prev,
        panX: currentPanX,
        panY: currentPanY,
        zoom: currentZoom,
      }));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(() => animationLoopRef.current?.());
      } else {
        animationRef.current = null;
      }
    };
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startAnimation = useCallback(
    (endPanX: number, endPanY: number, endZoom: number, duration: number) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationRef.current = {
        isAnimating: true,
        startTime: performance.now(),
        duration,
        startPanX: state.panX,
        startPanY: state.panY,
        startZoom: state.zoom,
        endPanX,
        endPanY,
        endZoom,
      };

      animationFrameRef.current = requestAnimationFrame(() => animationLoopRef.current?.());
    },
    [state.panX, state.panY, state.zoom]
  );

  // ---------------------------------------------------------------------------
  // VIEWPORT ACTIONS
  // ---------------------------------------------------------------------------

  const setPan = useCallback((x: number, y: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationRef.current = null;
    }
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
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationRef.current = null;
    }
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
  // ANIMATED VIEWPORT ACTIONS
  // ---------------------------------------------------------------------------

  const animateZoomTo = useCallback(
    (newZoom: number, centerX: number, centerY: number) => {
      const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      const target = calculateZoomAnimationTarget(
        state.panX,
        state.panY,
        state.zoom,
        clampedZoom,
        centerX,
        centerY
      );
      startAnimation(target.panX, target.panY, target.zoom, ZOOM_ANIMATION_DURATION);
    },
    [state.panX, state.panY, state.zoom, startAnimation]
  );

  const animateZoomIn = useCallback(
    (centerX?: number, centerY?: number) => {
      const nextLevel = ZOOM_LEVELS.find((level) => level > state.zoom) ?? MAX_ZOOM;
      const cx = centerX ?? 0;
      const cy = centerY ?? 0;

      if (centerX !== undefined && centerY !== undefined) {
        animateZoomTo(nextLevel, cx, cy);
      } else {
        startAnimation(state.panX, state.panY, nextLevel, ZOOM_ANIMATION_DURATION);
      }
    },
    [state.zoom, state.panX, state.panY, animateZoomTo, startAnimation]
  );

  const animateZoomOut = useCallback(
    (centerX?: number, centerY?: number) => {
      const prevLevel = [...ZOOM_LEVELS].reverse().find((level) => level < state.zoom) ?? MIN_ZOOM;
      const cx = centerX ?? 0;
      const cy = centerY ?? 0;

      if (centerX !== undefined && centerY !== undefined) {
        animateZoomTo(prevLevel, cx, cy);
      } else {
        startAnimation(state.panX, state.panY, prevLevel, ZOOM_ANIMATION_DURATION);
      }
    },
    [state.zoom, state.panX, state.panY, animateZoomTo, startAnimation]
  );

  const animateResetView = useCallback(() => {
    startAnimation(0, 0, 1, RESET_VIEW_ANIMATION_DURATION);
  }, [startAnimation]);

  // ---------------------------------------------------------------------------
  // ELEMENT ACTIONS
  // ---------------------------------------------------------------------------

  const addElement = useCallback((element: Omit<CanvasElement, "id">): string => {
    const id = generateId();
    const newElement: CanvasElement = { ...element, id };
    setState((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedIds: [id],
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
    setState((prev) => {
      // Also clean up any group children data
      const newGroupChildren = new Map(prev.groupChildren);
      ids.forEach((id) => {
        newGroupChildren.delete(id);
      });

      return {
        ...prev,
        elements: prev.elements.filter((el) => !ids.includes(el.id)),
        selectedIds: prev.selectedIds.filter((id) => !ids.includes(id)),
        groupChildren: newGroupChildren,
      };
    });
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
  // Z-ORDER ACTIONS
  // ---------------------------------------------------------------------------

  const bringToFrontAction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      elements: bringToFront(prev.elements, prev.selectedIds),
    }));
  }, []);

  const sendToBackAction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      elements: sendToBack(prev.elements, prev.selectedIds),
    }));
  }, []);

  const bringForwardAction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      elements: bringForward(prev.elements, prev.selectedIds),
    }));
  }, []);

  const sendBackwardAction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      elements: sendBackward(prev.elements, prev.selectedIds),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // GROUP ACTIONS
  // ---------------------------------------------------------------------------

  const groupSelected = useCallback(() => {
    setState((prev) => {
      if (!canGroup(prev.elements, prev.selectedIds)) {
        return prev;
      }

      // Get selected elements
      const selectedElements = prev.elements.filter((el) =>
        prev.selectedIds.includes(el.id)
      );

      // Calculate bounding box
      const bounds = calculateBoundingBox(selectedElements);

      // Generate group ID
      const groupId = generateId();

      // Create group element
      const groupElement: CanvasElement = {
        id: groupId,
        type: "group",
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        rotation: 0,
        fill: "transparent",
        stroke: "#6366f1",
        strokeWidth: 1,
        name: `Group (${selectedElements.length})`,
        locked: false,
        visible: true,
        childIds: prev.selectedIds,
      };

      // Convert children to relative positions
      const relativeChildren = makePositionsRelative(selectedElements, bounds.x, bounds.y);

      // Find insertion position (where the topmost selected element was)
      const selectedIndices = prev.elements
        .map((el, i) => (prev.selectedIds.includes(el.id) ? i : -1))
        .filter((i) => i !== -1);
      const maxIndex = Math.max(...selectedIndices);

      // Remove selected elements
      const remainingElements = prev.elements.filter(
        (el) => !prev.selectedIds.includes(el.id)
      );

      // Calculate correct insert position after removal
      const insertIndex = Math.min(
        maxIndex - (selectedIndices.length - 1),
        remainingElements.length
      );

      // Insert group at the correct position
      const newElements = [
        ...remainingElements.slice(0, insertIndex),
        groupElement,
        ...remainingElements.slice(insertIndex),
      ];

      // Store children with relative positions
      const newGroupChildren = new Map(prev.groupChildren);
      newGroupChildren.set(groupId, relativeChildren);

      return {
        ...prev,
        elements: newElements,
        selectedIds: [groupId],
        groupChildren: newGroupChildren,
      };
    });
  }, []);

  const ungroupSelected = useCallback(() => {
    setState((prev) => {
      // Find groups in selection
      const groupIds = prev.selectedIds.filter((id) => {
        const el = prev.elements.find((e) => e.id === id);
        return el?.type === "group";
      });

      if (groupIds.length === 0) return prev;

      let newElements = [...prev.elements];
      const newSelectedIds: string[] = [];
      const newGroupChildren = new Map(prev.groupChildren);

      groupIds.forEach((groupId) => {
        const groupIndex = newElements.findIndex((el) => el.id === groupId);
        if (groupIndex === -1) return;

        const group = newElements[groupIndex];
        const children = newGroupChildren.get(groupId);

        if (!children) return;

        // Convert children back to absolute positions
        const absoluteChildren = makePositionsAbsolute(children, group.x, group.y);

        // Remove group and insert children at its position
        newElements = [
          ...newElements.slice(0, groupIndex),
          ...absoluteChildren,
          ...newElements.slice(groupIndex + 1),
        ];

        // Add children to selection
        newSelectedIds.push(...absoluteChildren.map((c) => c.id));

        // Remove group children data
        newGroupChildren.delete(groupId);
      });

      // Add non-group selected items back to selection
      const nonGroupSelectedIds = prev.selectedIds.filter(
        (id) => !groupIds.includes(id)
      );
      newSelectedIds.push(...nonGroupSelectedIds);

      return {
        ...prev,
        elements: newElements,
        selectedIds: newSelectedIds,
        groupChildren: newGroupChildren,
      };
    });
  }, []);

  const canGroupSelection = useCallback((): boolean => {
    return canGroup(state.elements, state.selectedIds);
  }, [state.elements, state.selectedIds]);

  const canUngroupSelection = useCallback((): boolean => {
    return canUngroup(state.elements, state.selectedIds);
  }, [state.elements, state.selectedIds]);

  // ---------------------------------------------------------------------------
  // SELECTION ACTIONS
  // ---------------------------------------------------------------------------

  const selectElement = useCallback((id: string, addToSelection = false) => {
    setState((prev) => {
      if (addToSelection) {
        const isSelected = prev.selectedIds.includes(id);
        return {
          ...prev,
          selectedIds: isSelected
            ? prev.selectedIds.filter((sid) => sid !== id)
            : [...prev.selectedIds, id],
        };
      }
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
  // SETTINGS ACTIONS
  // ---------------------------------------------------------------------------

  const setSnapToGrid = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, snapToGrid: enabled }));
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setState((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setState((prev) => ({ ...prev, gridSize: Math.max(1, size) }));
  }, []);

  const setShowGrid = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showGrid: show }));
  }, []);

  const toggleShowGrid = useCallback(() => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const setShowRulers = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showRulers: show }));
  }, []);

  const toggleShowRulers = useCallback(() => {
    setState((prev) => ({ ...prev, showRulers: !prev.showRulers }));
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
    animateZoomTo,
    animateZoomIn,
    animateZoomOut,
    animateResetView,
    addElement,
    updateElement,
    deleteElements,
    moveElements,
    bringToFront: bringToFrontAction,
    sendToBack: sendToBackAction,
    bringForward: bringForwardAction,
    sendBackward: sendBackwardAction,
    groupSelected,
    ungroupSelected,
    canGroupSelection,
    canUngroupSelection,
    selectElement,
    deselectAll,
    selectAll,
    setSnapToGrid,
    toggleSnapToGrid,
    setGridSize,
    setShowGrid,
    toggleShowGrid,
    setShowRulers,
    toggleShowRulers,
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

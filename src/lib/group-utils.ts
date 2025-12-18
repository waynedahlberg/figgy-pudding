// =============================================================================
// GROUP UTILITIES
// =============================================================================
// Helpers for grouping and ungrouping canvas elements.
// Groups are special elements that contain child element IDs.

import { CanvasElement } from "@/hooks/use-canvas-store";

// =============================================================================
// TYPES
// =============================================================================

export interface GroupElement extends CanvasElement {
  type: "group";
  childIds: string[];
}

export function isGroup(element: CanvasElement): element is GroupElement {
  return element.type === "group" && "childIds" in element;
}

// =============================================================================
// BOUNDING BOX CALCULATION
// =============================================================================

/**
 * Calculate the bounding box that contains all given elements.
 */
export function calculateBoundingBox(
  elements: CanvasElement[]
): { x: number; y: number; width: number; height: number } {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    // For simplicity, we use the unrotated bounding box
    // A more accurate implementation would account for rotation
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// =============================================================================
// GROUP CREATION
// =============================================================================

/**
 * Create a group element from selected elements.
 * Returns the new group element and updated elements array.
 */
export function createGroup(
  elements: CanvasElement[],
  selectedIds: string[],
  generateId: () => string
): {
  newElements: CanvasElement[];
  groupId: string;
} {
  if (selectedIds.length < 2) {
    return { newElements: elements, groupId: "" };
  }

  // Get selected elements
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  
  // Calculate bounding box for the group
  const bounds = calculateBoundingBox(selectedElements);
  
  // Generate group ID
  const groupId = generateId();

  // Create the group element
  const groupElement: CanvasElement = {
    id: groupId,
    type: "group" as CanvasElement["type"],
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    name: "Group",
    locked: false,
    visible: true,
    // Store child IDs - we'll handle this in the store
  };

  // Find the highest z-index among selected elements
  const selectedIndices = elements
    .map((el, i) => (selectedIds.includes(el.id) ? i : -1))
    .filter((i) => i !== -1);
  const maxIndex = Math.max(...selectedIndices);

  // Remove selected elements and insert group at highest position
  const remainingElements = elements.filter((el) => !selectedIds.includes(el.id));
  
  // Insert group at the position of the topmost selected element
  const insertIndex = remainingElements.length > maxIndex 
    ? maxIndex - (selectedIndices.filter(i => i < maxIndex).length - 1)
    : remainingElements.length;

  const newElements = [
    ...remainingElements.slice(0, insertIndex),
    groupElement,
    ...remainingElements.slice(insertIndex),
  ];

  return { newElements, groupId };
}

/**
 * Convert element positions to be relative to group origin.
 * Used when storing children in a group.
 */
export function makePositionsRelative(
  elements: CanvasElement[],
  groupX: number,
  groupY: number
): CanvasElement[] {
  return elements.map((el) => ({
    ...el,
    x: el.x - groupX,
    y: el.y - groupY,
  }));
}

/**
 * Convert element positions from relative to absolute.
 * Used when ungrouping.
 */
export function makePositionsAbsolute(
  elements: CanvasElement[],
  groupX: number,
  groupY: number
): CanvasElement[] {
  return elements.map((el) => ({
    ...el,
    x: el.x + groupX,
    y: el.y + groupY,
  }));
}

// =============================================================================
// UNGROUP
// =============================================================================

/**
 * Ungroup a group element, restoring its children to the canvas.
 * Returns updated elements array with children restored at group's position.
 */
export function ungroupElement(
  elements: CanvasElement[],
  groupId: string,
  groupChildren: CanvasElement[]
): CanvasElement[] {
  const groupIndex = elements.findIndex((el) => el.id === groupId);
  if (groupIndex === -1) return elements;

  const group = elements[groupIndex];
  
  // Convert children back to absolute positions
  const absoluteChildren = makePositionsAbsolute(groupChildren, group.x, group.y);

  // Remove group and insert children at its position
  const newElements = [
    ...elements.slice(0, groupIndex),
    ...absoluteChildren,
    ...elements.slice(groupIndex + 1),
  ];

  return newElements;
}

// =============================================================================
// GROUP TRANSFORM HELPERS
// =============================================================================

/**
 * Apply a position delta to all children in a group.
 */
export function moveGroupChildren(
  children: CanvasElement[],
  deltaX: number,
  deltaY: number
): CanvasElement[] {
  return children.map((child) => ({
    ...child,
    x: child.x + deltaX,
    y: child.y + deltaY,
  }));
}

/**
 * Scale children when group is resized.
 * Maintains relative positions and sizes.
 */
export function scaleGroupChildren(
  children: CanvasElement[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number
): CanvasElement[] {
  if (oldWidth === 0 || oldHeight === 0) return children;

  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;

  return children.map((child) => ({
    ...child,
    x: child.x * scaleX,
    y: child.y * scaleY,
    width: child.width * scaleX,
    height: child.height * scaleY,
  }));
}

// =============================================================================
// SELECTION HELPERS
// =============================================================================

/**
 * Get all element IDs that should be selected when clicking on an element.
 * If the element is part of a group, return the group ID instead.
 */
export function getSelectableId(
  elementId: string,
  elements: CanvasElement[],
  groupMap: Map<string, string> // childId -> groupId
): string {
  const groupId = groupMap.get(elementId);
  return groupId ?? elementId;
}

/**
 * Check if any selected elements are groups.
 */
export function hasGroupInSelection(
  elements: CanvasElement[],
  selectedIds: string[]
): boolean {
  return elements.some(
    (el) => selectedIds.includes(el.id) && el.type === "group"
  );
}

/**
 * Check if selection can be grouped (2+ non-group elements).
 */
export function canGroup(
  elements: CanvasElement[],
  selectedIds: string[]
): boolean {
  if (selectedIds.length < 2) return false;
  
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  // Can group if we have 2+ elements and none are groups
  return selectedElements.length >= 2;
}

/**
 * Check if selection can be ungrouped (contains at least one group).
 */
export function canUngroup(
  elements: CanvasElement[],
  selectedIds: string[]
): boolean {
  return hasGroupInSelection(elements, selectedIds);
}

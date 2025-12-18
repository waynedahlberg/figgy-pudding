// =============================================================================
// Z-ORDER UTILITIES
// =============================================================================
// Helpers for managing element stacking order (z-index).
// Elements are ordered by their position in the array - later = on top.

import { CanvasElement } from "@/hooks/use-canvas-store";

/**
 * Move elements to the front (top of stack).
 * Selected elements maintain their relative order.
 */
export function bringToFront(
  elements: CanvasElement[],
  selectedIds: string[]
): CanvasElement[] {
  const selected: CanvasElement[] = [];
  const others: CanvasElement[] = [];

  // Separate selected from others, maintaining order
  elements.forEach((el) => {
    if (selectedIds.includes(el.id)) {
      selected.push(el);
    } else {
      others.push(el);
    }
  });

  // Selected elements go at the end (top)
  return [...others, ...selected];
}

/**
 * Move elements to the back (bottom of stack).
 * Selected elements maintain their relative order.
 */
export function sendToBack(
  elements: CanvasElement[],
  selectedIds: string[]
): CanvasElement[] {
  const selected: CanvasElement[] = [];
  const others: CanvasElement[] = [];

  elements.forEach((el) => {
    if (selectedIds.includes(el.id)) {
      selected.push(el);
    } else {
      others.push(el);
    }
  });

  // Selected elements go at the start (bottom)
  return [...selected, ...others];
}

/**
 * Move elements forward one step (swap with the element above).
 * If multiple selected, they move together maintaining relative order.
 */
export function bringForward(
  elements: CanvasElement[],
  selectedIds: string[]
): CanvasElement[] {
  const result = [...elements];
  
  // Find the highest index among selected elements
  let highestSelectedIndex = -1;
  for (let i = 0; i < result.length; i++) {
    if (selectedIds.includes(result[i].id)) {
      highestSelectedIndex = i;
    }
  }

  // If already at top, nothing to do
  if (highestSelectedIndex === -1 || highestSelectedIndex === result.length - 1) {
    return result;
  }

  // Find the next non-selected element above the highest selected
  const swapIndex = highestSelectedIndex + 1;
  
  // Move each selected element up by one, starting from the top
  for (let i = result.length - 1; i >= 0; i--) {
    if (selectedIds.includes(result[i].id) && i < result.length - 1) {
      // Find next position that's not selected
      let targetIndex = i + 1;
      while (targetIndex < result.length && selectedIds.includes(result[targetIndex].id)) {
        targetIndex++;
      }
      if (targetIndex < result.length && targetIndex === swapIndex) {
        // Swap with the element above
        const temp = result[targetIndex];
        result[targetIndex] = result[i];
        result[i] = temp;
      }
    }
  }

  // Simpler approach: move all selected elements up by one position together
  const selectedIndices = result
    .map((el, i) => (selectedIds.includes(el.id) ? i : -1))
    .filter((i) => i !== -1);

  if (selectedIndices.length === 0) return result;

  const maxIndex = Math.max(...selectedIndices);
  
  // If the highest selected is already at top, can't move up
  if (maxIndex >= result.length - 1) return result;

  // Check if there's a non-selected element right above our selection group
  const elementAbove = result[maxIndex + 1];
  if (selectedIds.includes(elementAbove.id)) return result;

  // Move the element above to below the lowest selected
  const minIndex = Math.min(...selectedIndices);
  const newResult = [...result];
  
  // Remove element above and insert it before the selection group
  const [removed] = newResult.splice(maxIndex + 1, 1);
  newResult.splice(minIndex, 0, removed);

  return newResult;
}

/**
 * Move elements backward one step (swap with the element below).
 * If multiple selected, they move together maintaining relative order.
 */
export function sendBackward(
  elements: CanvasElement[],
  selectedIds: string[]
): CanvasElement[] {
  const result = [...elements];

  const selectedIndices = result
    .map((el, i) => (selectedIds.includes(el.id) ? i : -1))
    .filter((i) => i !== -1);

  if (selectedIndices.length === 0) return result;

  const minIndex = Math.min(...selectedIndices);
  
  // If the lowest selected is already at bottom, can't move down
  if (minIndex <= 0) return result;

  // Check if there's a non-selected element right below our selection group
  const elementBelow = result[minIndex - 1];
  if (selectedIds.includes(elementBelow.id)) return result;

  // Move the element below to above the highest selected
  const maxIndex = Math.max(...selectedIndices);
  const newResult = [...result];
  
  // Remove element below and insert it after the selection group
  const [removed] = newResult.splice(minIndex - 1, 1);
  newResult.splice(maxIndex, 0, removed);

  return newResult;
}

/**
 * Get the z-index of an element (its position in the array).
 */
export function getElementZIndex(
  elements: CanvasElement[],
  elementId: string
): number {
  return elements.findIndex((el) => el.id === elementId);
}

/**
 * Check if element can be brought forward.
 */
export function canBringForward(
  elements: CanvasElement[],
  selectedIds: string[]
): boolean {
  if (selectedIds.length === 0) return false;
  
  const selectedIndices = elements
    .map((el, i) => (selectedIds.includes(el.id) ? i : -1))
    .filter((i) => i !== -1);
  
  const maxIndex = Math.max(...selectedIndices);
  return maxIndex < elements.length - 1;
}

/**
 * Check if element can be sent backward.
 */
export function canSendBackward(
  elements: CanvasElement[],
  selectedIds: string[]
): boolean {
  if (selectedIds.length === 0) return false;
  
  const selectedIndices = elements
    .map((el, i) => (selectedIds.includes(el.id) ? i : -1))
    .filter((i) => i !== -1);
  
  const minIndex = Math.min(...selectedIndices);
  return minIndex > 0;
}

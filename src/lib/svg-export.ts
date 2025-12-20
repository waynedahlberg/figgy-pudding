// =============================================================================
// SVG EXPORT UTILITIES
// =============================================================================
// Functions for exporting canvas elements to SVG format.

import { CanvasElement } from "@/hooks/use-canvas-store";

// =============================================================================
// ELEMENT TO SVG STRING
// =============================================================================

/**
 * Convert a single canvas element to an SVG string.
 */
export function elementToSVGString(element: CanvasElement): string {
  const { type, x, y, width, height, rotation, fill, stroke, strokeWidth } = element;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const transform = rotation ? ` transform="rotate(${rotation} ${centerX} ${centerY})"` : "";

  switch (type) {
    case "ellipse":
      return `<ellipse cx="${centerX}" cy="${centerY}" rx="${width / 2}" ry="${height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`;

    case "group":
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" ry="4" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="5,5"${transform}/>`;

    case "rectangle":
    case "frame":
    case "image":
    default:
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" ry="4" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`;
  }
}

// =============================================================================
// BOUNDING BOX CALCULATION
// =============================================================================

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculate the bounding box for a set of elements.
 */
export function calculateBoundingBox(elements: CanvasElement[]): BoundingBox {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
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
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// =============================================================================
// ELEMENTS TO SVG DOCUMENT
// =============================================================================

export interface ExportOptions {
  /** Padding around the content in pixels */
  padding?: number;
  /** Background color (transparent if not specified) */
  backgroundColor?: string;
  /** Include hidden elements */
  includeHidden?: boolean;
  /** Only export selected elements (pass selectedIds) */
  selectedIds?: string[];
  /** Custom width (overrides auto-calculated) */
  width?: number;
  /** Custom height (overrides auto-calculated) */
  height?: number;
}

/**
 * Convert canvas elements to a complete SVG document string.
 */
export function elementsToSVG(
  elements: CanvasElement[],
  options: ExportOptions = {}
): string {
  const {
    padding = 20,
    backgroundColor,
    includeHidden = false,
    selectedIds,
    width: customWidth,
    height: customHeight,
  } = options;

  // Filter elements
  let exportElements = elements;
  
  // Filter by selection if specified
  if (selectedIds && selectedIds.length > 0) {
    exportElements = exportElements.filter((el) => selectedIds.includes(el.id));
  }
  
  // Filter hidden elements unless includeHidden is true
  if (!includeHidden) {
    exportElements = exportElements.filter((el) => el.visible);
  }

  if (exportElements.length === 0) {
    const w = customWidth || 100;
    const h = customHeight || 100;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
  }

  // Calculate bounding box
  const bounds = calculateBoundingBox(exportElements);

  const width = customWidth || bounds.width + padding * 2;
  const height = customHeight || bounds.height + padding * 2;
  const offsetX = -bounds.minX + padding;
  const offsetY = -bounds.minY + padding;

  // Build SVG content
  const bgRect = backgroundColor 
    ? `\n  <rect width="100%" height="100%" fill="${backgroundColor}"/>`
    : "";

  const elementsSVG = exportElements
    .map((el) => {
      // Offset element positions to fit in the export bounds
      const offsetElement = { ...el, x: el.x + offsetX, y: el.y + offsetY };
      return `  ${elementToSVGString(offsetElement)}`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bgRect}
${elementsSVG}
</svg>`;
}

// =============================================================================
// DOWNLOAD SVG
// =============================================================================

/**
 * Trigger a download of an SVG string as a file.
 */
export function downloadSVG(svgString: string, filename: string = "canvas-export.svg"): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// =============================================================================
// COPY SVG TO CLIPBOARD
// =============================================================================

/**
 * Copy an SVG string to the clipboard.
 */
export async function copySVGToClipboard(svgString: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (error) {
    console.error("Failed to copy SVG to clipboard:", error);
    return false;
  }
}

// =============================================================================
// CONVENIENCE EXPORT FUNCTIONS
// =============================================================================

/**
 * Export all visible elements and download as SVG.
 */
export function exportAllToSVG(
  elements: CanvasElement[],
  filename?: string,
  options?: Omit<ExportOptions, "selectedIds">
): void {
  const svg = elementsToSVG(elements, options);
  downloadSVG(svg, filename);
}

/**
 * Export selected elements and download as SVG.
 */
export function exportSelectedToSVG(
  elements: CanvasElement[],
  selectedIds: string[],
  filename?: string,
  options?: Omit<ExportOptions, "selectedIds">
): void {
  const svg = elementsToSVG(elements, { ...options, selectedIds });
  downloadSVG(svg, filename || "selection-export.svg");
}

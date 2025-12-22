"use client";

// =============================================================================
// INFINITE CANVAS - SVG VERSION
// =============================================================================
// This file now exports the SVG-based canvas implementation.
// The SVG canvas provides:
// - Native SVG export capability
// - Foundation for path/bezier tools
// - Same interaction behavior as the DOM version
//
// To revert to DOM-based rendering, import from './dom-canvas' instead.

export { InfiniteCanvas } from "./svg-canvas";

// Re-export SVG utilities for external use
export { elementsToSVG, elementToSVGString } from "./svg-element-renderer";

// Re-export tool bar components
export { ToolBar, FloatingToolBar, FloatingElementsPanel, ToolIndicator } from "./tool-bar";

// Re-export top toolbar
export { TopToolbar, CompactTopBar } from "./top-toolbar";

// Re-export pen tool hook for advanced usage
export { usePenTool } from "./pen-tool";

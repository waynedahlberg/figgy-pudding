// =============================================================================
// COLOR UTILITIES
// =============================================================================
// Comprehensive color conversion and manipulation utilities.
// Supports: HEX, RGB, HSL, HSB/HSV, and basic parsing.

// =============================================================================
// TYPES
// =============================================================================

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface RGBA extends RGB {
  a: number; // 0-1
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSLA extends HSL {
  a: number; // 0-1
}

export interface HSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
}

export interface HSBA extends HSB {
  a: number; // 0-1
}

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsb";

export interface ParsedColor {
  rgba: RGBA;
  hex: string;
  hsl: HSLA;
  hsb: HSBA;
}

// =============================================================================
// HEX CONVERSIONS
// =============================================================================

/**
 * Convert HEX to RGB.
 */
export function hexToRgb(hex: string): RGB | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");
  
  // Handle shorthand (e.g., "f00" -> "ff0000")
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  
  if (fullHex.length !== 6) return null;
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to HEX.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// =============================================================================
// HSL CONVERSIONS
// =============================================================================

/**
 * Convert RGB to HSL.
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB.
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// =============================================================================
// HSB/HSV CONVERSIONS
// =============================================================================

/**
 * Convert RGB to HSB (also known as HSV).
 */
export function rgbToHsb(r: number, g: number, b: number): HSB {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100),
  };
}

/**
 * Convert HSB to RGB.
 */
export function hsbToRgb(h: number, s: number, b: number): RGB {
  h /= 360;
  s /= 100;
  b /= 100;
  
  let r = 0, g = 0, bl = 0;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = b; g = t; bl = p; break;
    case 1: r = q; g = b; bl = p; break;
    case 2: r = p; g = b; bl = t; break;
    case 3: r = p; g = q; bl = b; break;
    case 4: r = t; g = p; bl = b; break;
    case 5: r = b; g = p; bl = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bl * 255),
  };
}

// =============================================================================
// PARSING
// =============================================================================

/**
 * Parse any color string and return all formats.
 */
export function parseColor(color: string): ParsedColor | null {
  const trimmed = color.trim().toLowerCase();
  
  // Try HEX
  if (trimmed.startsWith("#") || /^[0-9a-f]{3,6}$/i.test(trimmed)) {
    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    const rgb = hexToRgb(hex);
    if (rgb) {
      return createParsedColor(rgb.r, rgb.g, rgb.b, 1);
    }
  }
  
  // Try RGBA/RGB
  const rgbaMatch = trimmed.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
    return createParsedColor(r, g, b, a);
  }
  
  // Try HSLA/HSL
  const hslaMatch = trimmed.match(
    /hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+)\s*)?\)/
  );
  if (hslaMatch) {
    const h = parseInt(hslaMatch[1]);
    const s = parseInt(hslaMatch[2]);
    const l = parseInt(hslaMatch[3]);
    const a = hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1;
    const rgb = hslToRgb(h, s, l);
    return createParsedColor(rgb.r, rgb.g, rgb.b, a);
  }
  
  return null;
}

/**
 * Create a ParsedColor object from RGBA values.
 */
export function createParsedColor(r: number, g: number, b: number, a: number): ParsedColor {
  const hsl = rgbToHsl(r, g, b);
  const hsb = rgbToHsb(r, g, b);
  
  return {
    rgba: { r, g, b, a },
    hex: rgbToHex(r, g, b),
    hsl: { ...hsl, a },
    hsb: { ...hsb, a },
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format color as string in specified format.
 */
export function formatColor(color: ParsedColor, format: ColorFormat): string {
  const { rgba, hex, hsl, hsb } = color;
  
  switch (format) {
    case "hex":
      return rgba.a < 1 
        ? `${hex}${Math.round(rgba.a * 255).toString(16).padStart(2, "0")}`
        : hex;
    case "rgb":
      return rgba.a < 1
        ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})`
        : `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
    case "hsl":
      return hsl.a < 1
        ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a.toFixed(2)})`
        : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    case "hsb":
      return `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)`;
    default:
      return hex;
  }
}

// =============================================================================
// COLOR MANIPULATION
// =============================================================================

/**
 * Lighten a color by a percentage.
 */
export function lighten(color: ParsedColor, amount: number): ParsedColor {
  const newL = Math.min(100, color.hsl.l + amount);
  const rgb = hslToRgb(color.hsl.h, color.hsl.s, newL);
  return createParsedColor(rgb.r, rgb.g, rgb.b, color.rgba.a);
}

/**
 * Darken a color by a percentage.
 */
export function darken(color: ParsedColor, amount: number): ParsedColor {
  const newL = Math.max(0, color.hsl.l - amount);
  const rgb = hslToRgb(color.hsl.h, color.hsl.s, newL);
  return createParsedColor(rgb.r, rgb.g, rgb.b, color.rgba.a);
}

/**
 * Get contrasting text color (black or white).
 */
export function getContrastColor(color: ParsedColor): string {
  // Calculate relative luminance
  const { r, g, b } = color.rgba;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// =============================================================================
// PRESET COLORS
// =============================================================================

export const PRESET_COLORS = [
  // Reds
  "#ef4444", "#dc2626", "#b91c1c", "#991b1b",
  // Oranges
  "#f97316", "#ea580c", "#c2410c", "#9a3412",
  // Yellows
  "#eab308", "#ca8a04", "#a16207", "#854d0e",
  // Greens
  "#22c55e", "#16a34a", "#15803d", "#166534",
  // Teals
  "#14b8a6", "#0d9488", "#0f766e", "#115e59",
  // Blues
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af",
  // Indigos
  "#6366f1", "#4f46e5", "#4338ca", "#3730a3",
  // Purples
  "#a855f7", "#9333ea", "#7e22ce", "#6b21a8",
  // Pinks
  "#ec4899", "#db2777", "#be185d", "#9d174d",
  // Grays
  "#6b7280", "#4b5563", "#374151", "#1f2937",
  // Black & White
  "#000000", "#ffffff",
];

// Recent colors storage key
export const RECENT_COLORS_KEY = "canvasforge-recent-colors";
export const MAX_RECENT_COLORS = 8;

/**
 * Get recent colors from localStorage.
 */
export function getRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a color to recent colors.
 */
export function addRecentColor(color: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentColors().filter((c) => c !== color);
    recent.unshift(color);
    const trimmed = recent.slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Pipette, ChevronDown, GripHorizontal } from "lucide-react";
import {
  ParsedColor,
  ColorFormat,
  parseColor,
  createParsedColor,
  formatColor,
  hsbToRgb,
  hslToRgb,
  PRESET_COLORS,
  getRecentColors,
  addRecentColor,
} from "@/lib/color-utils";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  showAlpha?: boolean;
}

interface Position {
  x: number;
  y: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PICKER_WIDTH = 256;
const PICKER_HEIGHT = 480; // Approximate height
const MARGIN = 8;

// =============================================================================
// POSITION CALCULATION
// =============================================================================

function calculateInitialPosition(anchorRect: DOMRect | null): Position {
  if (!anchorRect) {
    // Center of screen as fallback
    return {
      x: window.innerWidth / 2 - PICKER_WIDTH / 2,
      y: window.innerHeight / 2 - PICKER_HEIGHT / 2,
    };
  }

  // Try to position to the left of the anchor
  let x = anchorRect.left - PICKER_WIDTH - MARGIN;
  let y = anchorRect.top - 50; // Offset up a bit to align nicely

  // If would go off left edge, position to the right instead
  if (x < MARGIN) {
    x = anchorRect.right + MARGIN;
  }

  // If would still go off right edge, center horizontally
  if (x + PICKER_WIDTH > window.innerWidth - MARGIN) {
    x = window.innerWidth / 2 - PICKER_WIDTH / 2;
  }

  // Ensure doesn't go off top
  if (y < MARGIN) {
    y = MARGIN;
  }

  // Ensure doesn't go off bottom
  if (y + PICKER_HEIGHT > window.innerHeight - MARGIN) {
    y = window.innerHeight - PICKER_HEIGHT - MARGIN;
  }

  return { x, y };
}

// =============================================================================
// MAIN COLOR PICKER COMPONENT
// =============================================================================

export function ColorPickerFloating({
  color,
  onChange,
  onClose,
  anchorRect,
  showAlpha = true,
}: ColorPickerProps) {
  // Parse initial color
  const initialParsed = parseColor(color) || createParsedColor(99, 102, 241, 1);

  const [parsedColor, setParsedColor] = useState<ParsedColor>(initialParsed);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [inputValue, setInputValue] = useState(formatColor(initialParsed, "hex"));
  const [recentColors, setRecentColors] = useState<string[]>(() => getRecentColors());
  const [position, setPosition] = useState<Position>(() =>
    calculateInitialPosition(anchorRect)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [prevColor, setPrevColor] = useState(color);
  const [prevFormat, setPrevFormat] = useState(format);

  // Update when external color or format changes
  if (color !== prevColor || format !== prevFormat) {
    const parsed = parseColor(color);
    if (parsed) {
      setParsedColor(parsed);
      setInputValue(formatColor(parsed, format));
    }
    setPrevColor(color);
    setPrevFormat(format);
  }

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Delay to avoid immediate close on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [onClose]);

  // Dragging logic
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to window
      newX = Math.max(MARGIN, Math.min(window.innerWidth - PICKER_WIDTH - MARGIN, newX));
      newY = Math.max(MARGIN, Math.min(window.innerHeight - PICKER_HEIGHT - MARGIN, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle color change from any source
  const handleColorChange = useCallback(
    (newParsed: ParsedColor) => {
      setParsedColor(newParsed);
      setInputValue(formatColor(newParsed, format));

      // Output in the appropriate format for the canvas
      const outputColor =
        newParsed.rgba.a < 1
          ? `rgba(${newParsed.rgba.r}, ${newParsed.rgba.g}, ${newParsed.rgba.b}, ${newParsed.rgba.a})`
          : newParsed.hex;

      onChange(outputColor);
    },
    [format, onChange]
  );

  // Handle text input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // Handle text input blur - parse and apply
  const handleInputBlur = () => {
    const parsed = parseColor(inputValue);
    if (parsed) {
      handleColorChange(parsed);
      addRecentColor(parsed.hex);
      setRecentColors(getRecentColors());
    } else {
      // Reset to current color if invalid
      setInputValue(formatColor(parsedColor, format));
    }
  };

  // Handle preset/recent color click
  const handlePresetClick = (hex: string) => {
    const parsed = parseColor(hex);
    if (parsed) {
      handleColorChange(parsed);
      addRecentColor(hex);
      setRecentColors(getRecentColors());
    }
  };

  // Handle eyedropper
  const handleEyedropper = async () => {
    if (!("EyeDropper" in window)) {
      alert("EyeDropper API is not supported in this browser");
      return;
    }

    try {
      // @ts-expect-error - EyeDropper API types
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const parsed = parseColor(result.sRGBHex);
      if (parsed) {
        handleColorChange(parsed);
        addRecentColor(parsed.hex);
        setRecentColors(getRecentColors());
      }
    } catch {
      // User canceled or error
    }
  };

  const pickerContent = (
    <div
      ref={containerRef}
      className="fixed z-9999 w-64 bg-surface1 rounded-lg border border-border-subtle shadow-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border-subtle cursor-move select-none bg-surface2/50"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Color Picker</span>
        </div>
        <div className="flex items-center gap-1">
          {"EyeDropper" in window && (
            <button
              onClick={handleEyedropper}
              className="p-1.5 hover:bg-surface2 rounded transition-colors"
              title="Pick color from screen"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Pipette className="w-4 h-4 text-text-secondary" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface2 rounded transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Saturation/Brightness picker */}
      <SaturationBrightnessPicker
        hue={parsedColor.hsb.h}
        saturation={parsedColor.hsb.s}
        brightness={parsedColor.hsb.b}
        onChange={(s, b) => {
          const rgb = hsbToRgb(parsedColor.hsb.h, s, b);
          const newParsed = createParsedColor(rgb.r, rgb.g, rgb.b, parsedColor.rgba.a);
          handleColorChange(newParsed);
        }}
      />

      {/* Hue slider */}
      <div className="px-3 py-2">
        <HueSlider
          hue={parsedColor.hsb.h}
          onChange={(h) => {
            const rgb = hsbToRgb(h, parsedColor.hsb.s, parsedColor.hsb.b);
            const newParsed = createParsedColor(rgb.r, rgb.g, rgb.b, parsedColor.rgba.a);
            handleColorChange(newParsed);
          }}
        />
      </div>

      {/* Alpha slider */}
      {showAlpha && (
        <div className="px-3 pb-2">
          <AlphaSlider
            color={parsedColor}
            alpha={parsedColor.rgba.a}
            onChange={(a) => {
              const newParsed = createParsedColor(
                parsedColor.rgba.r,
                parsedColor.rgba.g,
                parsedColor.rgba.b,
                a
              );
              handleColorChange(newParsed);
            }}
          />
        </div>
      )}

      {/* Color preview and input */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          {/* Preview swatch */}
          <div
            className="w-10 h-10 rounded border border-border-subtle shrink-0 checkerboard-bg"
          >
            <div
              className="w-full h-full rounded"
              style={{
                backgroundColor: `rgba(${parsedColor.rgba.r}, ${parsedColor.rgba.g}, ${parsedColor.rgba.b}, ${parsedColor.rgba.a})`,
              }}
            />
          </div>

          {/* Format selector and input */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <FormatSelector format={format} onChange={setFormat} />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="w-full px-2 py-1 text-xs font-mono bg-surface2 border border-border-subtle rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Value inputs */}
      <div className="px-3 pb-2">
        <ColorValueInputs
          parsedColor={parsedColor}
          format={format}
          onChange={handleColorChange}
          showAlpha={showAlpha}
        />
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-xs text-text-muted mb-1.5">Recent</div>
          <div className="flex flex-wrap gap-1">
            {recentColors.map((hex, i) => (
              <button
                key={`${hex}-${i}`}
                onClick={() => handlePresetClick(hex)}
                className="w-5 h-5 rounded border border-border-subtle hover:scale-110 transition-transform"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset colors */}
      <div className="px-3 pb-3">
        <div className="text-xs text-text-muted mb-1.5">Presets</div>
        <div className="grid grid-cols-10 gap-1">
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              onClick={() => handlePresetClick(hex)}
              className={cn(
                "w-5 h-5 rounded border hover:scale-110 transition-transform",
                hex === parsedColor.hex
                  ? "ring-2 ring-accent ring-offset-1 ring-offset-surface1"
                  : "border-border-subtle"
              )}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(pickerContent, document.body);
}

// =============================================================================
// SATURATION/BRIGHTNESS PICKER
// =============================================================================

interface SaturationBrightnessPickerProps {
  hue: number;
  saturation: number;
  brightness: number;
  onChange: (saturation: number, brightness: number) => void;
}

function SaturationBrightnessPicker({
  hue,
  saturation,
  brightness,
  onChange,
}: SaturationBrightnessPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromPosition = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      onChange(Math.round(x * 100), Math.round((1 - y) * 100));
    },
    [onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPosition(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateFromPosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateFromPosition]);

  const rgb = hsbToRgb(hue, 100, 100);
  const pureColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  return (
    <div
      ref={containerRef}
      className="relative h-40 cursor-crosshair"
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, transparent),
          ${pureColor}
        `,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Picker indicator */}
      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none"
        style={{
          left: `${saturation}%`,
          top: `${100 - brightness}%`,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

// =============================================================================
// HUE SLIDER
// =============================================================================

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

function HueSlider({ hue, onChange }: HueSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromPosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(Math.round(x * 360));
    },
    [onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPosition(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateFromPosition(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateFromPosition]);

  return (
    <div
      ref={containerRef}
      className="relative h-3 rounded cursor-pointer"
      style={{
        background: `linear-gradient(to right, 
          hsl(0, 100%, 50%), 
          hsl(60, 100%, 50%), 
          hsl(120, 100%, 50%), 
          hsl(180, 100%, 50%), 
          hsl(240, 100%, 50%), 
          hsl(300, 100%, 50%), 
          hsl(360, 100%, 50%)
        )`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute w-3 h-3 bg-white rounded-full shadow-md border border-gray-300 pointer-events-none"
        style={{
          left: `${(hue / 360) * 100}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

// =============================================================================
// ALPHA SLIDER
// =============================================================================

interface AlphaSliderProps {
  color: ParsedColor;
  alpha: number;
  onChange: (alpha: number) => void;
}

function AlphaSlider({ color, alpha, onChange }: AlphaSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromPosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(Math.round(x * 100) / 100);
    },
    [onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPosition(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateFromPosition(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateFromPosition]);

  const { r, g, b } = color.rgba;

  return (
    <div
      ref={containerRef}
      className="relative h-3 rounded cursor-pointer checkerboard-bg"
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute inset-0 rounded"
        style={{
          background: `linear-gradient(to right, transparent, rgb(${r}, ${g}, ${b}))`,
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white rounded-full shadow-md border border-gray-300 pointer-events-none"
        style={{
          left: `${alpha * 100}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

// =============================================================================
// FORMAT SELECTOR
// =============================================================================

interface FormatSelectorProps {
  format: ColorFormat;
  onChange: (format: ColorFormat) => void;
}

function FormatSelector({ format, onChange }: FormatSelectorProps) {
  const formats: ColorFormat[] = ["hex", "rgb", "hsl", "hsb"];

  return (
    <div className="relative">
      <select
        value={format}
        onChange={(e) => onChange(e.target.value as ColorFormat)}
        className="appearance-none bg-surface2 text-text-primary text-xs font-medium px-2 py-0.5 pr-5 rounded border border-border-subtle cursor-pointer hover:bg-surface3 transition-colors focus:outline-none focus:ring-1 focus:ring-accent uppercase"
      >
        {formats.map((f) => (
          <option key={f} value={f}>
            {f.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
    </div>
  );
}

// =============================================================================
// COLOR VALUE INPUTS
// =============================================================================

interface ColorValueInputsProps {
  parsedColor: ParsedColor;
  format: ColorFormat;
  onChange: (color: ParsedColor) => void;
  showAlpha: boolean;
}

function ColorValueInputs({
  parsedColor,
  format,
  onChange,
  showAlpha,
}: ColorValueInputsProps) {
  const handleRgbChange = (channel: "r" | "g" | "b", value: number) => {
    const newRgba = { ...parsedColor.rgba, [channel]: Math.max(0, Math.min(255, value)) };
    const newParsed = createParsedColor(newRgba.r, newRgba.g, newRgba.b, newRgba.a);
    onChange(newParsed);
  };

  const handleHslChange = (channel: "h" | "s" | "l", value: number) => {
    const newHsl = { ...parsedColor.hsl };
    if (channel === "h") newHsl.h = Math.max(0, Math.min(360, value));
    else if (channel === "s") newHsl.s = Math.max(0, Math.min(100, value));
    else newHsl.l = Math.max(0, Math.min(100, value));

    const rgbFromHsl = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const newParsed = createParsedColor(rgbFromHsl.r, rgbFromHsl.g, rgbFromHsl.b, parsedColor.rgba.a);
    onChange(newParsed);
  };

  const handleHsbChange = (channel: "h" | "s" | "b", value: number) => {
    const newHsb = { ...parsedColor.hsb };
    if (channel === "h") newHsb.h = Math.max(0, Math.min(360, value));
    else if (channel === "s") newHsb.s = Math.max(0, Math.min(100, value));
    else newHsb.b = Math.max(0, Math.min(100, value));

    const rgb = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
    const newParsed = createParsedColor(rgb.r, rgb.g, rgb.b, parsedColor.rgba.a);
    onChange(newParsed);
  };

  const handleAlphaChange = (value: number) => {
    const newParsed = createParsedColor(
      parsedColor.rgba.r,
      parsedColor.rgba.g,
      parsedColor.rgba.b,
      Math.max(0, Math.min(1, value / 100))
    );
    onChange(newParsed);
  };

  const renderInputs = () => {
    switch (format) {
      case "rgb":
        return (
          <>
            <ValueInput label="R" value={parsedColor.rgba.r} max={255} onChange={(v) => handleRgbChange("r", v)} />
            <ValueInput label="G" value={parsedColor.rgba.g} max={255} onChange={(v) => handleRgbChange("g", v)} />
            <ValueInput label="B" value={parsedColor.rgba.b} max={255} onChange={(v) => handleRgbChange("b", v)} />
            {showAlpha && (
              <ValueInput label="A" value={Math.round(parsedColor.rgba.a * 100)} max={100} onChange={handleAlphaChange} suffix="%" />
            )}
          </>
        );
      case "hsl":
        return (
          <>
            <ValueInput label="H" value={parsedColor.hsl.h} max={360} onChange={(v) => handleHslChange("h", v)} suffix="°" />
            <ValueInput label="S" value={parsedColor.hsl.s} max={100} onChange={(v) => handleHslChange("s", v)} suffix="%" />
            <ValueInput label="L" value={parsedColor.hsl.l} max={100} onChange={(v) => handleHslChange("l", v)} suffix="%" />
            {showAlpha && (
              <ValueInput label="A" value={Math.round(parsedColor.rgba.a * 100)} max={100} onChange={handleAlphaChange} suffix="%" />
            )}
          </>
        );
      case "hsb":
        return (
          <>
            <ValueInput label="H" value={parsedColor.hsb.h} max={360} onChange={(v) => handleHsbChange("h", v)} suffix="°" />
            <ValueInput label="S" value={parsedColor.hsb.s} max={100} onChange={(v) => handleHsbChange("s", v)} suffix="%" />
            <ValueInput label="B" value={parsedColor.hsb.b} max={100} onChange={(v) => handleHsbChange("b", v)} suffix="%" />
            {showAlpha && (
              <ValueInput label="A" value={Math.round(parsedColor.rgba.a * 100)} max={100} onChange={handleAlphaChange} suffix="%" />
            )}
          </>
        );
      default: // hex - show RGB inputs
        return (
          <>
            <ValueInput label="R" value={parsedColor.rgba.r} max={255} onChange={(v) => handleRgbChange("r", v)} />
            <ValueInput label="G" value={parsedColor.rgba.g} max={255} onChange={(v) => handleRgbChange("g", v)} />
            <ValueInput label="B" value={parsedColor.rgba.b} max={255} onChange={(v) => handleRgbChange("b", v)} />
            {showAlpha && (
              <ValueInput label="A" value={Math.round(parsedColor.rgba.a * 100)} max={100} onChange={handleAlphaChange} suffix="%" />
            )}
          </>
        );
    }
  };

  return <div className="flex gap-1">{renderInputs()}</div>;
}

// =============================================================================
// VALUE INPUT
// =============================================================================

interface ValueInputProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}

function ValueInput({ label, value, max, onChange, suffix }: ValueInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleBlur = () => {
    const num = parseInt(localValue);
    if (!isNaN(num)) {
      onChange(Math.max(0, Math.min(max, num)));
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-text-muted text-center mb-0.5">{label}</div>
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const newVal = Math.min(max, parseInt(localValue) + (e.shiftKey ? 10 : 1));
              onChange(newVal);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const newVal = Math.max(0, parseInt(localValue) - (e.shiftKey ? 10 : 1));
              onChange(newVal);
            }
          }}
          className={cn(
            "w-full px-1 py-1 text-xs font-mono text-center",
            "bg-surface2 border border-border-subtle rounded",
            "text-text-primary",
            "focus:outline-none focus:ring-1 focus:ring-accent",
            suffix && "pr-4"
          )}
        />
        {suffix && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COLOR WELL (Trigger button for the floating picker)
// =============================================================================

interface ColorWellProps {
  color: string;
  onChange: (color: string) => void;
  showAlpha?: boolean;
}

export function ColorWell({ color, onChange, showAlpha = true }: ColorWellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const parsedColor = parseColor(color);
  const displayColor = parsedColor
    ? `rgba(${parsedColor.rgba.r}, ${parsedColor.rgba.g}, ${parsedColor.rgba.b}, ${parsedColor.rgba.a})`
    : color;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="w-8 h-8 rounded border border-border-subtle cursor-pointer hover:ring-2 hover:ring-accent transition-all checkerboard-bg"
      >
        <div
          className="w-full h-full rounded"
          style={{ backgroundColor: displayColor }}
        />
      </button>

      {isOpen && (
        <ColorPickerFloating
          color={color}
          onChange={onChange}
          onClose={handleClose}
          anchorRect={anchorRect}
          showAlpha={showAlpha}
        />
      )}
    </>
  );
}

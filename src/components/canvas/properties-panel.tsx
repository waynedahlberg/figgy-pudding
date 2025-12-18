"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Frame,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useCanvasStore, CanvasElement } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PropertiesPanel({ isOpen, onClose }: PropertiesPanelProps) {
  const { selectedIds, elements, updateElement } = useCanvasStore();

  // Get selected elements
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const hasSelection = selectedElements.length > 0;
  const singleSelection = selectedElements.length === 1;
  const firstElement = selectedElements[0];

  // Section collapse state
  const [sectionsOpen, setSectionsOpen] = useState({
    transform: true,
    appearance: true,
    stroke: true,
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-surface1 border-l border-border-subtle flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Properties</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface2 rounded transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasSelection ? (
          <div className="p-4 text-center">
            <p className="text-sm text-text-muted">No element selected</p>
            <p className="text-xs text-text-muted mt-1">
              Select an element to edit its properties
            </p>
          </div>
        ) : (
          <>
            {/* Element Info Header */}
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <ElementTypeIcon type={firstElement.type} />
                {singleSelection ? (
                  <NameInput element={firstElement} onUpdate={updateElement} />
                ) : (
                  <span className="text-sm text-text-primary font-medium">
                    {selectedElements.length} elements
                  </span>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1 mt-2">
                <QuickActionButton
                  icon={selectedElements.every((el) => el.visible) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  label={selectedElements.every((el) => el.visible) ? "Visible" : "Hidden"}
                  isActive={selectedElements.every((el) => el.visible)}
                  onClick={() => {
                    const newVisible = !selectedElements.every((el) => el.visible);
                    selectedIds.forEach((id) => updateElement(id, { visible: newVisible }));
                  }}
                />
                <QuickActionButton
                  icon={selectedElements.every((el) => el.locked) ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  label={selectedElements.every((el) => el.locked) ? "Locked" : "Unlocked"}
                  isActive={selectedElements.every((el) => el.locked)}
                  onClick={() => {
                    const newLocked = !selectedElements.every((el) => el.locked);
                    selectedIds.forEach((id) => updateElement(id, { locked: newLocked }));
                  }}
                />
              </div>
            </div>

            {/* Transform Section */}
            <PropertySection
              title="Transform"
              isOpen={sectionsOpen.transform}
              onToggle={() => toggleSection("transform")}
            >
              {singleSelection ? (
                <SingleTransformInputs element={firstElement} onUpdate={updateElement} />
              ) : (
                <MultiTransformInputs
                  elements={selectedElements}
                  selectedIds={selectedIds}
                  onUpdate={updateElement}
                />
              )}
            </PropertySection>

            {/* Appearance Section */}
            <PropertySection
              title="Appearance"
              isOpen={sectionsOpen.appearance}
              onToggle={() => toggleSection("appearance")}
            >
              <AppearanceInputs
                elements={selectedElements}
                selectedIds={selectedIds}
                onUpdate={updateElement}
              />
            </PropertySection>

            {/* Stroke Section */}
            <PropertySection
              title="Stroke"
              isOpen={sectionsOpen.stroke}
              onToggle={() => toggleSection("stroke")}
            >
              <StrokeInputs
                elements={selectedElements}
                selectedIds={selectedIds}
                onUpdate={updateElement}
              />
            </PropertySection>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PROPERTY SECTION
// =============================================================================

interface PropertySectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function PropertySection({ title, isOpen, onToggle, children }: PropertySectionProps) {
  return (
    <div className="border-b border-border-subtle">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface2/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        )}
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {title}
        </span>
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// =============================================================================
// ELEMENT TYPE ICON
// =============================================================================

function ElementTypeIcon({ type }: { type: CanvasElement["type"] }) {
  const iconClass = "w-4 h-4 text-text-muted";

  switch (type) {
    case "rectangle":
      return <Square className={iconClass} />;
    case "ellipse":
      return <Circle className={iconClass} />;
    case "text":
      return <Type className={iconClass} />;
    case "image":
      return <ImageIcon className={iconClass} />;
    case "frame":
      return <Frame className={iconClass} />;
    default:
      return <Square className={iconClass} />;
  }
}

// =============================================================================
// NAME INPUT
// =============================================================================

interface NameInputProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

function NameInput({ element, onUpdate }: NameInputProps) {
  const [value, setValue] = useState(element.name);
  const prevNameRef = useRef(element.name);

  useEffect(() => {
    // Sync with external name changes
    if (prevNameRef.current !== element.name) {
      prevNameRef.current = element.name;
      // eslint-disable-next-line
      setValue(element.name);
    }
  }, [element.name]);

  const handleBlur = () => {
    if (value !== element.name) {
      onUpdate(element.id, { name: value });
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="flex-1 text-sm font-medium text-text-primary bg-transparent border-none outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1"
    />
  );
}

// =============================================================================
// QUICK ACTION BUTTON
// =============================================================================

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function QuickActionButton({ icon, label, isActive, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
        isActive
          ? "bg-accent/20 text-accent"
          : "bg-surface2 text-text-secondary hover:text-text-primary"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// NUMBER INPUT
// =============================================================================

interface NumberInputProps {
  label: string;
  value: number | "mixed";
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value === "mixed" ? "" : String(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Only sync external value changes (not during local editing)
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const newValue = value === "mixed" ? "" : String(value);
      // eslint-disable-next-line
      setLocalValue(newValue);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
      setLocalValue(String(clamped));
    } else {
      setLocalValue(value === "mixed" ? "" : String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentValue = parseFloat(localValue) || 0;
      const delta = e.key === "ArrowUp" ? step : -step;
      const multiplier = e.shiftKey ? 10 : 1;
      let newValue = currentValue + delta * multiplier;
      if (min !== undefined) newValue = Math.max(min, newValue);
      if (max !== undefined) newValue = Math.min(max, newValue);
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-muted">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={value === "mixed" ? "Mixed" : undefined}
          className={cn(
            "w-full px-2 py-1.5 text-xs font-mono",
            "bg-surface2 border border-border-subtle rounded",
            "text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
            unit && "pr-6"
          )}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COLOR INPUT
// =============================================================================

interface ColorInputProps {
  label: string;
  value: string | "mixed";
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const displayValue = value === "mixed" ? "#888888" : value;

  // Extract hex for color picker (handle rgba)
  const getHexValue = (color: string): string => {
    if (color.startsWith("#")) return color.slice(0, 7);
    if (color.startsWith("rgb")) {
      // Parse rgba/rgb
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, "0");
        const g = parseInt(match[2]).toString(16).padStart(2, "0");
        const b = parseInt(match[3]).toString(16).padStart(2, "0");
        return `#${r}${g}${b}`;
      }
    }
    return "#888888";
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={getHexValue(displayValue)}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-border-subtle cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value === "mixed" ? "" : displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={value === "mixed" ? "Mixed" : undefined}
          className={cn(
            "flex-1 px-2 py-1.5 text-xs font-mono",
            "bg-surface2 border border-border-subtle rounded",
            "text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          )}
        />
      </div>
    </div>
  );
}

// =============================================================================
// SINGLE TRANSFORM INPUTS
// =============================================================================

interface SingleTransformInputsProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

function SingleTransformInputs({ element, onUpdate }: SingleTransformInputsProps) {
  return (
    <div className="space-y-3">
      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="X"
          value={Math.round(element.x)}
          onChange={(v) => onUpdate(element.id, { x: v })}
          step={1}
        />
        <NumberInput
          label="Y"
          value={Math.round(element.y)}
          onChange={(v) => onUpdate(element.id, { y: v })}
          step={1}
        />
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Width"
          value={Math.round(element.width)}
          onChange={(v) => onUpdate(element.id, { width: v })}
          min={1}
          step={1}
        />
        <NumberInput
          label="Height"
          value={Math.round(element.height)}
          onChange={(v) => onUpdate(element.id, { height: v })}
          min={1}
          step={1}
        />
      </div>

      {/* Rotation */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Rotation"
          value={Math.round(element.rotation)}
          onChange={(v) => onUpdate(element.id, { rotation: v })}
          min={0}
          max={360}
          step={1}
          unit="°"
        />
        <div className="flex items-end">
          <button
            onClick={() => onUpdate(element.id, { rotation: 0 })}
            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-surface2 hover:bg-surface3 border border-border-subtle rounded transition-colors"
            title="Reset rotation"
          >
            <RotateCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MULTI TRANSFORM INPUTS
// =============================================================================

interface MultiTransformInputsProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

function MultiTransformInputs({ elements, selectedIds, onUpdate }: MultiTransformInputsProps) {
  // For multi-selection, show "mixed" if values differ
  const getMixedOrValue = (getter: (el: CanvasElement) => number): number | "mixed" => {
    const values = elements.map(getter);
    const first = values[0];
    return values.every((v) => Math.round(v) === Math.round(first)) ? Math.round(first) : "mixed";
  };

  const updateAll = (updates: Partial<CanvasElement>) => {
    selectedIds.forEach((id) => onUpdate(id, updates));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted italic">
        Editing {elements.length} elements
      </p>

      {/* Size - can change all at once */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Width"
          value={getMixedOrValue((el) => el.width)}
          onChange={(v) => updateAll({ width: v })}
          min={1}
          step={1}
        />
        <NumberInput
          label="Height"
          value={getMixedOrValue((el) => el.height)}
          onChange={(v) => updateAll({ height: v })}
          min={1}
          step={1}
        />
      </div>

      {/* Rotation */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Rotation"
          value={getMixedOrValue((el) => el.rotation)}
          onChange={(v) => updateAll({ rotation: v })}
          min={0}
          max={360}
          step={1}
          unit="°"
        />
        <div className="flex items-end">
          <button
            onClick={() => updateAll({ rotation: 0 })}
            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-surface2 hover:bg-surface3 border border-border-subtle rounded transition-colors"
            title="Reset rotation"
          >
            <RotateCw className="w-3 h-3" />
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// APPEARANCE INPUTS
// =============================================================================

interface AppearanceInputsProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

function AppearanceInputs({ elements, selectedIds, onUpdate }: AppearanceInputsProps) {
  const getMixedOrColor = (getter: (el: CanvasElement) => string): string | "mixed" => {
    const values = elements.map(getter);
    const first = values[0];
    return values.every((v) => v === first) ? first : "mixed";
  };

  const updateAll = (updates: Partial<CanvasElement>) => {
    selectedIds.forEach((id) => onUpdate(id, updates));
  };

  return (
    <div className="space-y-3">
      <ColorInput
        label="Fill"
        value={getMixedOrColor((el) => el.fill)}
        onChange={(v) => updateAll({ fill: v })}
      />
    </div>
  );
}

// =============================================================================
// STROKE INPUTS
// =============================================================================

interface StrokeInputsProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

function StrokeInputs({ elements, selectedIds, onUpdate }: StrokeInputsProps) {
  const getMixedOrColor = (getter: (el: CanvasElement) => string): string | "mixed" => {
    const values = elements.map(getter);
    const first = values[0];
    return values.every((v) => v === first) ? first : "mixed";
  };

  const getMixedOrValue = (getter: (el: CanvasElement) => number): number | "mixed" => {
    const values = elements.map(getter);
    const first = values[0];
    return values.every((v) => v === first) ? first : "mixed";
  };

  const updateAll = (updates: Partial<CanvasElement>) => {
    selectedIds.forEach((id) => onUpdate(id, updates));
  };

  return (
    <div className="space-y-3">
      <ColorInput
        label="Stroke Color"
        value={getMixedOrColor((el) => el.stroke)}
        onChange={(v) => updateAll({ stroke: v })}
      />
      <NumberInput
        label="Stroke Width"
        value={getMixedOrValue((el) => el.strokeWidth)}
        onChange={(v) => updateAll({ strokeWidth: v })}
        min={0}
        max={20}
        step={1}
        unit="px"
      />
    </div>
  );
}

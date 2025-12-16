"use client";

import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  RulerIcon,
  Magnet,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

// Predefined zoom levels (percentages)
const ZOOM_LEVELS = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400];

// Minimum and maximum zoom values
const MIN_ZOOM = 10;
const MAX_ZOOM = 400;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BottomToolbar() {
  // View state
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Zoom state (percentage, e.g., 100 = 100%)
  const [zoom, setZoom] = useState(100);

  // Cursor position (would be updated by canvas in real app)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // ---------- ZOOM HANDLERS ----------

  const handleZoomIn = () => {
    // Find the next zoom level up
    const nextLevel = ZOOM_LEVELS.find((level) => level > zoom);
    if (nextLevel) {
      setZoom(nextLevel);
    } else {
      setZoom(MAX_ZOOM);
    }
  };

  const handleZoomOut = () => {
    // Find the next zoom level down
    const prevLevel = [...ZOOM_LEVELS].reverse().find((level) => level < zoom);
    if (prevLevel) {
      setZoom(prevLevel);
    } else {
      setZoom(MIN_ZOOM);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    // Clamp zoom to valid range
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    setZoom(clampedZoom);
  };

  const handleFitToScreen = () => {
    // In a real app, this would calculate zoom based on canvas/viewport size
    setZoom(100);
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="h-full flex items-center justify-between px-3">
      {/* ============ LEFT SECTION - Cursor Position ============ */}
      <div className="flex items-center gap-3 min-w-[140px]">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
          <MousePointer2 className="w-3 h-3" />
          <span>
            X: <span className="text-text-primary w-8 inline-block">{cursorPosition.x}</span>
          </span>
          <span>
            Y: <span className="text-text-primary w-8 inline-block">{cursorPosition.y}</span>
          </span>
        </div>
      </div>

      {/* ============ CENTER SECTION - View Toggles ============ */}
      <div className="flex items-center gap-1">
        <ViewToggle
          icon={<Grid3X3 className="w-3.5 h-3.5" />}
          label="Grid"
          shortcut="⌘'"
          isActive={showGrid}
          onClick={() => setShowGrid(!showGrid)}
        />
        <ViewToggle
          icon={<RulerIcon className="w-3.5 h-3.5" />}
          label="Rulers"
          shortcut="⇧R"
          isActive={showRulers}
          onClick={() => setShowRulers(!showRulers)}
        />
        <ViewToggle
          icon={<Magnet className="w-3.5 h-3.5" />}
          label="Snap"
          shortcut="⌘⇧;"
          isActive={snapToGrid}
          onClick={() => setSnapToGrid(!snapToGrid)}
        />
      </div>

      {/* ============ RIGHT SECTION - Zoom Controls ============ */}
      <div className="flex items-center gap-1 min-w-[180px] justify-end">
        {/* Zoom Out Button */}
        <ZoomButton
          icon={<ZoomOut className="w-3.5 h-3.5" />}
          label="Zoom out"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
        />

        {/* Zoom Level Dropdown */}
        <ZoomDropdown
          zoom={zoom}
          onZoomChange={handleZoomChange}
        />

        {/* Zoom In Button */}
        <ZoomButton
          icon={<ZoomIn className="w-3.5 h-3.5" />}
          label="Zoom in"
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
        />

        {/* Divider */}
        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Fit to Screen Button */}
        <ZoomButton
          icon={<Maximize className="w-3.5 h-3.5" />}
          label="Fit to screen"
          onClick={handleFitToScreen}
        />
      </div>
    </div>
  );
}

// =============================================================================
// VIEW TOGGLE COMPONENT
// =============================================================================

interface ViewToggleProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive: boolean;
  onClick: () => void;
}

function ViewToggle({ icon, label, shortcut, isActive, onClick }: ViewToggleProps) {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
        isActive
          ? "bg-accent/20 text-accent"
          : "text-text-secondary hover:bg-surface2 hover:text-text-primary"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// ZOOM BUTTON COMPONENT
// =============================================================================

interface ZoomButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ZoomButton({ icon, label, onClick, disabled }: ZoomButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "p-1.5 rounded transition-colors",
        disabled
          ? "text-text-muted cursor-not-allowed"
          : "text-text-secondary hover:bg-surface2 hover:text-text-primary"
      )}
    >
      {icon}
    </button>
  );
}

// =============================================================================
// ZOOM DROPDOWN COMPONENT
// =============================================================================

interface ZoomDropdownProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

function ZoomDropdown({ zoom, onZoomChange }: ZoomDropdownProps) {
  // Handle select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onZoomChange(value);
    }
  };

  return (
    <div className="relative">
      <select
        value={zoom}
        onChange={handleSelectChange}
        className={cn(
          "appearance-none bg-surface2 text-text-primary text-xs",
          "px-2 py-1 rounded cursor-pointer",
          "hover:bg-surface3 transition-colors",
          "font-mono min-w-[65px] text-center",
          "focus:outline-none focus:ring-1 focus:ring-accent"
        )}
      >
        {ZOOM_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow (optional - select has default) */}
      {/* You could add a custom chevron icon here if desired */}
    </div>
  );
}

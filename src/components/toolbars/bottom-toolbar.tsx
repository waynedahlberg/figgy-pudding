"use client";

import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Ruler,
  Magnet,
  MousePointer2,
} from "lucide-react";
import { useCanvasStore, ZOOM_LEVELS, MIN_ZOOM, MAX_ZOOM } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// COMPONENT

export function BottomToolbar() {
  // Canvas store
  const { zoom, zoomIn, zoomOut, setZoom, fitToScreen } = useCanvasStore();

  // View toggles (local state for now)
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Mouse position (would come from canvas in production)
  const [cursorPosition] = useState({ x: 0, y: 0 });

  // Handle zoom dropdown change
  const handleZoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
  };

  // Format zoom for display (e.g., 1 -> "100%")
  const zoomPercent = Math.round(zoom * 100);

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
          icon={<Ruler className="w-3.5 h-3.5" />}
          label="Rulers"
          shortcut="⇧R"
          isActive={showRulers}
          onClick={() => setShowRulers(!showRulers)}
        />
        <ViewToggle
          icon={<Magnet className="w-3.5 h-3.5" />}
          label="Snap"
          shortcut="⌘⇧;"
          isActive={snapEnabled}
          onClick={() => setSnapEnabled(!snapEnabled)}
        />
      </div>

      {/* ============ RIGHT SECTION - Zoom Controls ============ */}
      <div className="flex items-center gap-1 min-w-[180px] justify-end">
        {/* Zoom Out */}
        <ZoomButton
          icon={<ZoomOut className="w-3.5 h-3.5" />}
          label="Zoom out (⌘-)"
          onClick={() => zoomOut()}
          disabled={zoom <= MIN_ZOOM}
        />

        {/* Zoom Dropdown */}
        <select
          value={zoom}
          onChange={handleZoomChange}
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
              {Math.round(level * 100)}%
            </option>
          ))}
          {/* Show current zoom if it's not a preset level */}
          {!ZOOM_LEVELS.includes(zoom) && (
            <option value={zoom}>{zoomPercent}%</option>
          )}
        </select>

        {/* Zoom In */}
        <ZoomButton
          icon={<ZoomIn className="w-3.5 h-3.5" />}
          label="Zoom in (⌘+)"
          onClick={() => zoomIn()}
          disabled={zoom >= MAX_ZOOM}
        />

        {/* Divider */}
        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Fit to Screen */}
        <ZoomButton
          icon={<Maximize className="w-3.5 h-3.5" />}
          label="Fit to screen (⌘0)"
          onClick={fitToScreen}
        />
      </div>
    </div>
  );
}

// VIEW TOGGLE

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

// ZOOM BUTTON

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

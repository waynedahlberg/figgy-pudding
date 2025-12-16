"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Type,
  Image,
  Pencil,
  Undo2,
  Redo2,
  Download,
  Share2,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { ToolbarButton } from "@/components/shared/toolbar-button";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

const tools = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "hand", icon: Hand, label: "Hand", shortcut: "H" },
  { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "image", icon: Image, label: "Image", shortcut: "I" },
  { id: "pen", icon: Pencil, label: "Pen", shortcut: "P" },
] as const;

type ToolId = (typeof tools)[number]["id"];

// =============================================================================
// PROPS
// =============================================================================

interface TopToolbarProps {
  isPaletteVisible?: boolean;
  onTogglePalette?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TopToolbar({ isPaletteVisible, onTogglePalette }: TopToolbarProps) {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ToolId>("select");

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (except for shortcuts that need them)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const tool = tools.find((t) => t.shortcut.toLowerCase() === key);
      if (tool) {
        setActiveTool(tool.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-full flex items-center justify-between px-2">
      {/* ============ LEFT SECTION ============ */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-surface0">CF</span>
          </div>
          <span className="font-semibold text-text-primary hidden sm:inline">
            CanvasForge
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border-subtle mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          icon={<Undo2 className="w-4 h-4" />}
          label="Undo"
          shortcut="⌘Z"
          onClick={() => console.log("Undo")}
          isDisabled
        />
        <ToolbarButton
          icon={<Redo2 className="w-4 h-4" />}
          label="Redo"
          shortcut="⌘⇧Z"
          onClick={() => console.log("Redo")}
          isDisabled
        />
      </div>

      {/* ============ CENTER SECTION - Tools ============ */}
      <div className="flex items-center gap-0.5 bg-surface2 rounded-lg p-1">
        {tools.map((tool) => (
          <ToolbarButton
            key={tool.id}
            icon={<tool.icon className="w-4 h-4" />}
            label={tool.label}
            shortcut={tool.shortcut}
            isActive={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
          />
        ))}
      </div>

      {/* ============ RIGHT SECTION ============ */}
      <div className="flex items-center gap-1">
        {/* Elements Palette Toggle */}
        {onTogglePalette && (
          <ToolbarButton
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Elements Palette"
            shortcut="⌘E"
            isActive={isPaletteVisible}
            onClick={onTogglePalette}
          />
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-border-subtle mx-1" />

        {/* Export */}
        <ToolbarButton
          icon={<Download className="w-4 h-4" />}
          label="Export"
          shortcut="⌘E"
          onClick={() => console.log("Export")}
        />

        {/* Share */}
        <ToolbarButton
          icon={<Share2 className="w-4 h-4" />}
          label="Share"
          shortcut="⌘⇧S"
          onClick={() => console.log("Share")}
          variant="accent"
        />

        {/* Settings */}
        <ToolbarButton
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          shortcut="⌘,"
          onClick={() => router.push("/settings")}
        />

        {/* User Avatar */}
        <button
          onClick={() => router.push("/settings/profile")}
          className="ml-1 w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-sm font-medium text-text-primary hover:ring-2 hover:ring-accent transition-all"
        >
          JD
        </button>
      </div>
    </div>
  );
}

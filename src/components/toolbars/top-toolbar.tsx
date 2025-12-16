"use client";

import React, { useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { ToolbarButton } from "@/components/shared/toolbar-button";
import { cn } from "@/lib/utils";

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

export function TopToolbar() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Keyboard shortcuts
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        const key = event.key.toLowerCase();
        const tool = tools.find((t) => t.shortcut.toLowerCase() === key);
        if (tool) {
          event.preventDefault();
          setActiveTool(tool.id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-full flex items-center justify-between px-3">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-border-subtle">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-surface0">LHC</span>
          </div>
          <span className="text-sm font-semibold text-text-primary hidden sm:block">
            Longhorn Canvas
          </span>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Undo2 className="w-4 h-4" />}
            label="Undo"
            shortcut="⌘Z"
            isDisabled={!canUndo}
            variant="ghost"
            onClick={() => console.log("Undo clicked")}
          />
          <ToolbarButton
            icon={<Redo2 className="w-4 h-4" />}
            label="Redo"
            shortcut="⌘⇧Z"
            isDisabled={!canRedo}
            variant="ghost"
            onClick={() => console.log("Redo clicked")}
          />
        </div>
      </div>

      {/* CENTER SECTION - TOOLS */}
      <div className="flex items-center gap-0.5 bg-surface2/50 rounded-lg p-1">
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

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2">
        <ToolbarButton
          icon={<Download className="w-4 h-4" />}
          label="Export"
          shortcut="⌘E"
          onClick={() => console.log("Export clicked")}
        />

        <button
          className={cn(
            "flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-colors",
            "bg-accent text-surface0 hover:bg-accent-hover"
          )}
          onClick={() => console.log("Share clicked")}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <div className="w-px h-5 bg-border-subtle mx-1" />

        <ToolbarButton
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          shortcut="⌘,"
          onClick={() => router.push("/settings/profile")}
        />

        <button
          className={cn(
            "flex items-center gap-1 pl-1 pr-2 h-8 rounded-md transition-colors",
            "hover:bg-surface2"
          )}
          onClick={() => console.log("User menu clicked")}
        >
          <div className="w-6 h-6 rounded-full bg-surface3 flex items-center justify-center">
            <span className="text-xs font-medium text-text-primary">JD</span>
          </div>
          <ChevronDown className="w-3 h-3 text-text-muted" />
        </button>
      </div>
    </div>
  );
}
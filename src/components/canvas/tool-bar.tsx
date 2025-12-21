"use client";

import { MousePointer2, Pen, Square, Circle } from "lucide-react";
import { useCanvasStore, ToolType } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface ToolDefinition {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

const tools: ToolDefinition[] = [
  {
    id: "select",
    label: "Select",
    icon: <MousePointer2 className="w-4 h-4" />,
    shortcut: "V",
  },
  {
    id: "pen",
    label: "Pen",
    icon: <Pen className="w-4 h-4" />,
    shortcut: "P",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    icon: <Square className="w-4 h-4" />,
    shortcut: "R",
  },
  {
    id: "ellipse",
    label: "Ellipse",
    icon: <Circle className="w-4 h-4" />,
    shortcut: "O",
  },
];

// =============================================================================
// TOOL BAR COMPONENT
// =============================================================================

interface ToolBarProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ToolBar({ orientation = "vertical", className }: ToolBarProps) {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div
      className={cn(
        "bg-surface1 border border-border-subtle rounded-lg p-1",
        orientation === "vertical" ? "flex flex-col gap-1" : "flex flex-row gap-1",
        className
      )}
    >
      {tools.map((tool) => (
        <ToolButton
          key={tool.id}
          tool={tool}
          isActive={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// TOOL BUTTON
// =============================================================================

interface ToolButtonProps {
  tool: ToolDefinition;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${tool.label} (${tool.shortcut})`}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded transition-colors",
        isActive
          ? "bg-accent text-white"
          : "text-text-secondary hover:bg-surface2 hover:text-text-primary"
      )}
    >
      {tool.icon}
    </button>
  );
}

// =============================================================================
// COMPACT TOOL INDICATOR (for status bar)
// =============================================================================

export function ToolIndicator() {
  const { activeTool } = useCanvasStore();
  
  const currentTool = tools.find((t) => t.id === activeTool);
  
  if (!currentTool) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-text-muted">Tool:</span>
      <span className="flex items-center gap-1 text-text-primary">
        {currentTool.icon}
        <span>{currentTool.label}</span>
      </span>
      <span className="text-text-muted">({currentTool.shortcut})</span>
    </div>
  );
}

// =============================================================================
// FLOATING TOOL BAR (positioned absolutely)
// =============================================================================

export function FloatingToolBar() {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
      <ToolBar orientation="vertical" />
    </div>
  );
}

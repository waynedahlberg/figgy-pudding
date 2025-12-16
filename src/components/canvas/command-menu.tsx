"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Square,
  Circle,
  Type,
  Image,
  Frame,
  Search,
  Plus,
} from "lucide-react";
import { useCanvasStore, CanvasElement } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: string;
}

// =============================================================================
// DEFAULT ELEMENT PROPERTIES
// =============================================================================

const ELEMENT_COLORS = [
  { fill: "rgba(99, 102, 241, 0.2)", stroke: "rgb(99, 102, 241)" },   // Indigo
  { fill: "rgba(236, 72, 153, 0.2)", stroke: "rgb(236, 72, 153)" },   // Pink
  { fill: "rgba(34, 197, 94, 0.2)", stroke: "rgb(34, 197, 94)" },     // Green
  { fill: "rgba(249, 115, 22, 0.2)", stroke: "rgb(249, 115, 22)" },   // Orange
  { fill: "rgba(14, 165, 233, 0.2)", stroke: "rgb(14, 165, 233)" },   // Sky
  { fill: "rgba(168, 85, 247, 0.2)", stroke: "rgb(168, 85, 247)" },   // Purple
];

function getRandomColor() {
  return ELEMENT_COLORS[Math.floor(Math.random() * ELEMENT_COLORS.length)];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addElement, panX, panY, zoom } = useCanvasStore();

  // ---------------------------------------------------------------------------
  // CREATE ELEMENT HELPERS
  // ---------------------------------------------------------------------------

  const createElementAtCenter = useCallback(
    (type: CanvasElement["type"], name: string, width = 150, height = 100) => {
      const color = getRandomColor();

      // Calculate canvas center (where pan 0,0 would put origin at viewport center)
      // We want to place elements roughly in view
      const canvasX = (-panX / zoom) + 100 + Math.random() * 200;
      const canvasY = (-panY / zoom) + 100 + Math.random() * 200;

      addElement({
        type,
        name,
        x: canvasX,
        y: canvasY,
        width,
        height,
        rotation: 0,
        fill: color.fill,
        stroke: color.stroke,
        strokeWidth: 2,
        locked: false,
        visible: true,
      });

      setIsOpen(false);
      setSearch("");
    },
    [addElement, panX, panY, zoom]
  );

  // ---------------------------------------------------------------------------
  // COMMAND ITEMS
  // ---------------------------------------------------------------------------

  const commands: CommandItem[] = [
    {
      id: "rectangle",
      label: "Rectangle",
      icon: <Square className="w-4 h-4" />,
      shortcut: "R",
      category: "Shapes",
      action: () => createElementAtCenter("rectangle", "Rectangle"),
    },
    {
      id: "ellipse",
      label: "Ellipse",
      icon: <Circle className="w-4 h-4" />,
      shortcut: "O",
      category: "Shapes",
      action: () => createElementAtCenter("ellipse", "Ellipse", 120, 120),
    },
    {
      id: "frame",
      label: "Frame",
      icon: <Frame className="w-4 h-4" />,
      shortcut: "F",
      category: "Shapes",
      action: () => createElementAtCenter("frame", "Frame", 200, 150),
    },
    {
      id: "text",
      label: "Text",
      icon: <Type className="w-4 h-4" />,
      shortcut: "T",
      category: "Content",
      action: () => createElementAtCenter("text", "Text Label", 100, 40),
    },
    {
      id: "image",
      label: "Image Placeholder",
      icon: <Image className="w-4 h-4" />,
      shortcut: "I",
      category: "Content",
      action: () => createElementAtCenter("image", "Image", 200, 150),
    },
  ];

  // ---------------------------------------------------------------------------
  // FILTERED COMMANDS
  // ---------------------------------------------------------------------------

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Flat list for keyboard navigation
  const flatCommands = Object.values(groupedCommands).flat();

  // ---------------------------------------------------------------------------
  // KEYBOARD HANDLING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input (except our search input)
      if (
        e.target instanceof HTMLInputElement &&
        e.target !== inputRef.current
      ) {
        return;
      }
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Open command menu with ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
        return;
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        return;
      }

      // Handle navigation when open
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatCommands.length - 1
          );
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatCommands, selectedIndex]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => {
          setIsOpen(false);
          setSearch("");
        }}
      />

      {/* Command Dialog */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-surface1 rounded-xl border border-border-subtle shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-text-muted bg-surface2 rounded">
              esc
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-80 overflow-y-auto py-2">
            {Object.entries(groupedCommands).length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                No commands found
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-4 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wider">
                    {category}
                  </div>

                  {/* Items */}
                  {items.map((item) => {
                    const index = flatCommands.findIndex((c) => c.id === item.id);
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-accent/20 text-text-primary"
                            : "text-text-secondary hover:bg-surface2"
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md",
                            isSelected ? "bg-accent/20" : "bg-surface2"
                          )}
                        >
                          {item.icon}
                        </div>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="px-2 py-0.5 text-xs text-text-muted bg-surface2 rounded">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-surface2 rounded">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-surface2 rounded">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-surface2 rounded">esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

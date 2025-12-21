"use client";

import { useEffect } from "react";
import {
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  Copy,
  Clipboard,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// KEYBOARD SHORTCUTS HELP
// =============================================================================

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  // Tools
  { keys: ["V"], description: "Select tool", category: "Tools" },
  { keys: ["H"], description: "Hand tool", category: "Tools" },
  { keys: ["R"], description: "Rectangle", category: "Tools" },
  { keys: ["O"], description: "Ellipse", category: "Tools" },
  { keys: ["T"], description: "Text", category: "Tools" },
  { keys: ["F"], description: "Frame", category: "Tools" },

  // Canvas
  { keys: ["Space", "Drag"], description: "Pan canvas", category: "Canvas" },
  { keys: ["Scroll"], description: "Zoom in/out", category: "Canvas" },
  { keys: ["⌘", "+"], description: "Zoom in", category: "Canvas" },
  { keys: ["⌘", "-"], description: "Zoom out", category: "Canvas" },
  { keys: ["⌘", "0"], description: "Reset view", category: "Canvas" },

  // Selection
  { keys: ["Click"], description: "Select element", category: "Selection" },
  { keys: ["Shift", "Click"], description: "Add to selection", category: "Selection" },
  { keys: ["Esc"], description: "Deselect all", category: "Selection" },
  { keys: ["⌘", "A"], description: "Select all", category: "Selection" },

  // Editing
  { keys: ["Delete"], description: "Delete selected", category: "Editing" },
  { keys: ["⌘", "K"], description: "Command menu", category: "Editing" },
];

// =============================================================================
// SHORTCUTS PANEL COMPONENT
// =============================================================================

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50">
        <div className="bg-surface1 rounded-xl border border-border-subtle shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Quick reference for all available shortcuts
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-text-secondary">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-2 py-0.5 text-xs font-mono bg-surface2 text-text-primary rounded border border-border-subtle"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border-subtle bg-surface0/50">
            <p className="text-xs text-text-muted text-center">
              Press <kbd className="px-1.5 py-0.5 bg-surface2 rounded text-text-primary">?</kbd> to toggle this panel
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// CONTEXT MENU COMPONENT
// =============================================================================

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  // Close on escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = () => onClose();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      className="fixed z-50 min-w-[180px] bg-surface1 rounded-lg border border-border-subtle shadow-xl py-1 overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => {
        if (item.divider) {
          return (
            <div
              key={item.id}
              className="my-1 border-t border-border-subtle"
            />
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
              item.disabled
                ? "text-text-muted cursor-not-allowed"
                : item.danger
                  ? "text-red-500 hover:bg-red-500/10"
                  : "text-text-primary hover:bg-surface2"
            )}
          >
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-text-muted">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// HOOK: USE CONTEXT MENU
// =============================================================================

import { useState, useCallback } from "react";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetId: string | null;
}

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    targetId: null,
  });

  const openContextMenu = useCallback((e: React.MouseEvent, targetId?: string) => {
    e.preventDefault();
    setState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetId: targetId ?? null,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...state,
    openContextMenu,
    closeContextMenu,
  };
}

// =============================================================================
// SELECTION INFO BAR
// =============================================================================

export function SelectionInfoBar() {
  const { selectedIds, elements, updateElement, deleteElements } = useCanvasStore();

  if (selectedIds.length === 0) return null;

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const firstElement = selectedElements[0];

  // Check if all selected elements share the same property
  const allVisible = selectedElements.every((el) => el.visible);
  const allLocked = selectedElements.every((el) => el.locked);

  const toggleVisibility = () => {
    selectedIds.forEach((id) => {
      updateElement(id, { visible: !allVisible });
    });
  };

  const toggleLock = () => {
    selectedIds.forEach((id) => {
      updateElement(id, { locked: !allLocked });
    });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-surface1/95 backdrop-blur-sm rounded-lg border border-border-subtle shadow-lg px-3 py-1.5">
        {/* Selection count */}
        <span className="text-xs font-medium text-text-secondary">
          {selectedIds.length} selected
        </span>

        {/* Divider */}
        <div className="w-px h-4 bg-border-subtle" />

        {/* Position (single selection only) */}
        {selectedIds.length === 1 && firstElement && (
          <>
            <span className="text-xs text-text-muted font-mono">
              X: {Math.round(firstElement.x)}
            </span>
            <span className="text-xs text-text-muted font-mono">
              Y: {Math.round(firstElement.y)}
            </span>
            <div className="w-px h-4 bg-border-subtle" />
          </>
        )}

        {/* Actions */}
        <button
          onClick={toggleVisibility}
          className="p-1 hover:bg-surface2 rounded transition-colors"
          title={allVisible ? "Hide" : "Show"}
        >
          {allVisible ? (
            <Eye className="w-3.5 h-3.5 text-text-secondary" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-text-secondary" />
          )}
        </button>

        <button
          onClick={toggleLock}
          className="p-1 hover:bg-surface2 rounded transition-colors"
          title={allLocked ? "Unlock" : "Lock"}
        >
          {allLocked ? (
            <Lock className="w-3.5 h-3.5 text-accent" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-text-secondary" />
          )}
        </button>

        <button
          onClick={() => deleteElements(selectedIds)}
          className="p-1 hover:bg-red-500/10 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// WELCOME TOAST
// =============================================================================

interface WelcomeToastProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function WelcomeToast({ isVisible, onDismiss }: WelcomeToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-3 bg-surface1/95 backdrop-blur-sm rounded-lg border border-border-subtle shadow-lg px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <MousePointer2 className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            Welcome to Zephyr!
          </p>
          <p className="text-xs text-text-secondary">
            Press <kbd className="px-1 py-0.5 bg-surface2 rounded">⌘K</kbd> to add elements or drag from the palette
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

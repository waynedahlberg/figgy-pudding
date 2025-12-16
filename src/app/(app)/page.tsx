"use client";

import { useState, useEffect, useCallback } from "react";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { CommandMenu } from "@/components/canvas/command-menu";
import { DragPalette } from "@/components/canvas/drag-palette";
import {
  ShortcutsPanel,
  SelectionInfoBar,
  WelcomeToast,
  ContextMenu,
  useContextMenu,
} from "@/components/canvas/polish-components";
import { usePaletteVisibility } from "./layout";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import {
  Copy,
  Clipboard,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function CanvasPage() {
  const { isPaletteVisible, setIsPaletteVisible } = usePaletteVisibility();
  const { selectedIds, elements, updateElement, deleteElements } = useCanvasStore();
  
  // UI state
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Context menu
  const {
    isOpen: isContextMenuOpen,
    x: contextMenuX,
    y: contextMenuY,
    targetId: contextMenuTargetId,
    openContextMenu,
    closeContextMenu,
  } = useContextMenu();

  // Keyboard shortcut for help panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // ? key for shortcuts panel
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build context menu items based on selection
  const getContextMenuItems = useCallback(() => {
    const hasSelection = selectedIds.length > 0;
    const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
    const allVisible = selectedElements.every((el) => el.visible);
    const allLocked = selectedElements.every((el) => el.locked);

    return [
      {
        id: "copy",
        label: "Copy",
        icon: <Copy className="w-3.5 h-3.5" />,
        shortcut: "⌘C",
        action: () => console.log("Copy"),
        disabled: !hasSelection,
      },
      {
        id: "paste",
        label: "Paste",
        icon: <Clipboard className="w-3.5 h-3.5" />,
        shortcut: "⌘V",
        action: () => console.log("Paste"),
        disabled: false,
      },
      {
        id: "divider-1",
        label: "",
        divider: true,
        action: () => {},
      },
      {
        id: "visibility",
        label: allVisible ? "Hide" : "Show",
        icon: allVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />,
        action: () => {
          selectedIds.forEach((id) => {
            updateElement(id, { visible: !allVisible });
          });
        },
        disabled: !hasSelection,
      },
      {
        id: "lock",
        label: allLocked ? "Unlock" : "Lock",
        icon: allLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />,
        action: () => {
          selectedIds.forEach((id) => {
            updateElement(id, { locked: !allLocked });
          });
        },
        disabled: !hasSelection,
      },
      {
        id: "divider-2",
        label: "",
        divider: true,
        action: () => {},
      },
      {
        id: "bring-forward",
        label: "Bring Forward",
        icon: <ArrowUp className="w-3.5 h-3.5" />,
        action: () => console.log("Bring forward"),
        disabled: !hasSelection,
      },
      {
        id: "send-backward",
        label: "Send Backward",
        icon: <ArrowDown className="w-3.5 h-3.5" />,
        action: () => console.log("Send backward"),
        disabled: !hasSelection,
      },
      {
        id: "divider-3",
        label: "",
        divider: true,
        action: () => {},
      },
      {
        id: "delete",
        label: "Delete",
        icon: <Trash2 className="w-3.5 h-3.5" />,
        shortcut: "⌫",
        action: () => deleteElements(selectedIds),
        disabled: !hasSelection,
        danger: true,
      },
    ];
  }, [selectedIds, elements, updateElement, deleteElements]);

  // Handle right-click on canvas
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      openContextMenu(e);
    },
    [openContextMenu]
  );

  return (
    <div onContextMenu={handleContextMenu} className="w-full h-full">
      {/* Main Canvas */}
      <InfiniteCanvas />

      {/* Command Menu (⌘K) */}
      <CommandMenu />

      {/* Drag Palette */}
      <DragPalette
        isVisible={isPaletteVisible}
        onClose={() => setIsPaletteVisible(false)}
      />

      {/* Selection Info Bar */}
      <SelectionInfoBar />

      {/* Welcome Toast */}
      <WelcomeToast
        isVisible={showWelcome}
        onDismiss={() => setShowWelcome(false)}
      />

      {/* Shortcuts Panel */}
      <ShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Context Menu */}
      {isContextMenuOpen && (
        <ContextMenu
          x={contextMenuX}
          y={contextMenuY}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

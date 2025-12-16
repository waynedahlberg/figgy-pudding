"use client";

import { useState } from "react";
import {
  Layers,
  FileStack,
  Component,
  Package,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  PanelLeftClose,
  PanelLeft,
  Trash2,
} from "lucide-react";
import { useCanvasStore, CanvasElement } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

const tabs = [
  { id: "layers", icon: Layers, label: "Layers" },
  { id: "pages", icon: FileStack, label: "Pages" },
  { id: "components", icon: Component, label: "Components" },
  { id: "assets", icon: Package, label: "Assets" },
] as const;

type TabId = (typeof tabs)[number]["id"];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<TabId>("layers");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-2 bg-surface1">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-surface2 rounded-md transition-colors mb-4"
          title="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4 text-text-secondary" />
        </button>

        <div className="flex flex-col items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsCollapsed(false);
              }}
              className={cn(
                "p-2 rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-surface3 text-accent"
                  : "hover:bg-surface2 text-text-secondary"
              )}
              title={tab.label}
            >
              <tab.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="h-full flex flex-col bg-surface1">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border-subtle">
        <div className="flex-1 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "text-text-primary border-b-2 border-accent -mb-px"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 mr-1 hover:bg-surface2 rounded-md transition-colors text-text-secondary"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {activeTab === "layers" && <LayersPanel />}
        {activeTab === "pages" && <PagesPanel />}
        {activeTab === "components" && <ComponentsPanel />}
        {activeTab === "assets" && <AssetsPanel />}
      </div>
    </div>
  );
}

// =============================================================================
// LAYERS PANEL - Connected to Canvas Store
// =============================================================================

function LayersPanel() {
  const {
    elements,
    selectedIds,
    selectElement,
    updateElement,
    deleteElements,
  } = useCanvasStore();

  // Reverse elements so top layers appear first
  const reversedElements = [...elements].reverse();

  return (
    <div className="p-2">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Layers ({elements.length})
        </span>
      </div>

      {/* Layer list */}
      <div className="space-y-0.5">
        {reversedElements.map((element) => (
          <LayerItem
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            onSelect={(addToSelection) => selectElement(element.id, addToSelection)}
            onToggleVisibility={() =>
              updateElement(element.id, { visible: !element.visible })
            }
            onToggleLock={() =>
              updateElement(element.id, { locked: !element.locked })
            }
            onDelete={() => deleteElements([element.id])}
          />
        ))}
      </div>

      {/* Empty state */}
      {elements.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No elements yet. Use the command menu (⌘K) to add elements.
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LAYER ITEM
// =============================================================================

interface LayerItemProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (addToSelection: boolean) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}

function LayerItem({
  element,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
}: LayerItemProps) {
  return (
    <div
      onClick={(e) => onSelect(e.shiftKey)}
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
        isSelected
          ? "bg-accent/20 text-text-primary"
          : "hover:bg-surface2 text-text-secondary",
        !element.visible && "opacity-50"
      )}
    >
      {/* Type indicator */}
      <LayerTypeIcon type={element.type} />

      {/* Name */}
      <span className="flex-1 text-sm truncate">{element.name}</span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={cn(
            "p-1 rounded hover:bg-surface3 transition-colors",
            !element.visible && "opacity-100"
          )}
          title={element.visible ? "Hide" : "Show"}
        >
          {element.visible ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className={cn(
            "p-1 rounded hover:bg-surface3 transition-colors",
            element.locked && "text-accent opacity-100"
          )}
          title={element.locked ? "Unlock" : "Lock"}
        >
          {element.locked ? (
            <Lock className="w-3 h-3" />
          ) : (
            <Unlock className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-500/20 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// LAYER TYPE ICON
// =============================================================================

function LayerTypeIcon({ type }: { type: CanvasElement["type"] }) {
  const colors: Record<CanvasElement["type"], string> = {
    frame: "bg-blue-500",
    rectangle: "bg-purple-500",
    ellipse: "bg-pink-500",
    text: "bg-green-500",
    image: "bg-orange-500",
  };

  return (
    <div
      className={cn("w-2.5 h-2.5 rounded-sm shrink-0", colors[type])}
      title={type}
    />
  );
}

// =============================================================================
// PLACEHOLDER PANELS
// =============================================================================

function PagesPanel() {
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <FileStack className="w-8 h-8 mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-secondary mb-1">Pages</p>
        <p className="text-xs text-text-muted">
          Organize your canvas into multiple pages
        </p>
      </div>
    </div>
  );
}

function ComponentsPanel() {
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <Component className="w-8 h-8 mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-secondary mb-1">Components</p>
        <p className="text-xs text-text-muted">
          Create reusable components from your designs
        </p>
      </div>
    </div>
  );
}

function AssetsPanel() {
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <Package className="w-8 h-8 mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-secondary mb-1">Assets</p>
        <p className="text-xs text-text-muted">
          Upload images and icons to use in your designs
        </p>
      </div>
    </div>
  );
}

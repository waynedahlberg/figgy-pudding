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
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface Layer {
  id: string;
  name: string;
  type: "frame" | "rectangle" | "ellipse" | "text" | "image";
  visible: boolean;
  locked: boolean;
}

// Tab definitions
const tabs = [
  { id: "layers", icon: Layers, label: "Layers" },
  { id: "pages", icon: FileStack, label: "Pages" },
  { id: "components", icon: Component, label: "Components" },
  { id: "assets", icon: Package, label: "Assets" },
] as const;

type TabId = (typeof tabs)[number]["id"];

// Mock layer data - in a real app this would come from state/context
const initialLayers: Layer[] = [
  { id: "1", name: "Header Section", type: "frame", visible: true, locked: false },
  { id: "2", name: "Hero Image", type: "image", visible: true, locked: false },
  { id: "3", name: "CTA Button", type: "rectangle", visible: true, locked: false },
  { id: "4", name: "Body Text", type: "text", visible: false, locked: false },
  { id: "5", name: "Background", type: "rectangle", visible: true, locked: true },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<TabId>("layers");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ---------- COLLAPSED STATE ----------
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-2 bg-surface1">
        {/* Expand button */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-surface2 rounded-md transition-colors mb-4"
          title="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4 text-text-secondary" />
        </button>

        {/* Tab icons only */}
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

  // ---------- EXPANDED STATE ----------
  return (
    <div className="h-full flex flex-col bg-surface1">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border-subtle">
        {/* Tabs */}
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

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 mr-1 hover:bg-surface2 rounded-md transition-colors text-text-secondary"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tab content - scrollable area */}
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
// LAYERS PANEL
// =============================================================================

function LayersPanel() {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("1");

  // Toggle layer visibility
  const toggleVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  // Toggle layer lock
  const toggleLock = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  return (
    <div className="p-2">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Layers
        </span>
        <button
          className="p-1 hover:bg-surface2 rounded transition-colors text-text-secondary hover:text-text-primary"
          title="Add layer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Layer list */}
      <div className="space-y-0.5">
        {layers.map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isSelected={selectedLayerId === layer.id}
            onSelect={() => setSelectedLayerId(layer.id)}
            onToggleVisibility={() => toggleVisibility(layer.id)}
            onToggleLock={() => toggleLock(layer.id)}
          />
        ))}
      </div>

      {/* Empty state (if no layers) */}
      {layers.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No layers yet. Add elements to the canvas.
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LAYER ITEM
// =============================================================================

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

function LayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
}: LayerItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
        isSelected
          ? "bg-accent/20 text-text-primary"
          : "hover:bg-surface2 text-text-secondary",
        !layer.visible && "opacity-50"
      )}
    >
      {/* Layer type indicator */}
      <LayerTypeIcon type={layer.type} />

      {/* Layer name */}
      <span className="flex-1 text-sm truncate">{layer.name}</span>

      {/* Action buttons - visible on hover or when relevant */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Don't trigger layer selection
            onToggleVisibility();
          }}
          className={cn(
            "p-1 rounded hover:bg-surface3 transition-colors",
            !layer.visible && "opacity-100" // Always show if hidden
          )}
          title={layer.visible ? "Hide layer" : "Show layer"}
        >
          {layer.visible ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>

        {/* Lock toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className={cn(
            "p-1 rounded hover:bg-surface3 transition-colors",
            layer.locked && "text-accent opacity-100" // Always show if locked
          )}
          title={layer.locked ? "Unlock layer" : "Lock layer"}
        >
          {layer.locked ? (
            <Lock className="w-3 h-3" />
          ) : (
            <Unlock className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// LAYER TYPE ICON
// =============================================================================

function LayerTypeIcon({ type }: { type: Layer["type"] }) {
  // Color mapping for different layer types
  const colors: Record<Layer["type"], string> = {
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
  const pages = [
    { id: "1", name: "Home", isActive: true },
    { id: "2", name: "About", isActive: false },
    { id: "3", name: "Contact", isActive: false },
  ];

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Pages
        </span>
        <button className="p-1 hover:bg-surface2 rounded transition-colors text-text-secondary hover:text-text-primary">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-0.5">
        {pages.map((page) => (
          <div
            key={page.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
              page.isActive
                ? "bg-accent/20 text-text-primary"
                : "hover:bg-surface2 text-text-secondary"
            )}
          >
            <FileStack className="w-3.5 h-3.5" />
            <span className="text-sm">{page.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsPanel() {
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <Component className="w-8 h-8 mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-secondary mb-1">No components yet</p>
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
        <p className="text-sm text-text-secondary mb-1">No assets yet</p>
        <p className="text-xs text-text-muted">
          Upload images and icons to use in your designs
        </p>
      </div>
    </div>
  );
}
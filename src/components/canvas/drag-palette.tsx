"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Frame,
  GripVertical,
  X,
} from "lucide-react";
import { useCanvasStore, CanvasElement } from "@/hooks/use-canvas-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface DragItem {
  id: string;
  type: CanvasElement["type"];
  label: string;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
}

interface Position {
  x: number;
  y: number;
}

// =============================================================================
// PALETTE ITEMS
// =============================================================================

const paletteItems: DragItem[] = [
  {
    id: "rectangle",
    type: "rectangle",
    label: "Rectangle",
    icon: <Square className="w-5 h-5" />,
    defaultWidth: 150,
    defaultHeight: 100,
  },
  {
    id: "ellipse",
    type: "ellipse",
    label: "Ellipse",
    icon: <Circle className="w-5 h-5" />,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: "frame",
    type: "frame",
    label: "Frame",
    icon: <Frame className="w-5 h-5" />,
    defaultWidth: 200,
    defaultHeight: 150,
  },
  {
    id: "text",
    type: "text",
    label: "Text",
    icon: <Type className="w-5 h-5" />,
    defaultWidth: 100,
    defaultHeight: 40,
  },
  {
    id: "image",
    type: "image",
    label: "Image",
    icon: <ImageIcon className="w-5 h-5" />,
    defaultWidth: 200,
    defaultHeight: 150,
  },
];

// =============================================================================
// COLORS
// =============================================================================

const ELEMENT_COLORS = [
  { fill: "rgba(99, 102, 241, 0.2)", stroke: "rgb(99, 102, 241)" },
  { fill: "rgba(236, 72, 153, 0.2)", stroke: "rgb(236, 72, 153)" },
  { fill: "rgba(34, 197, 94, 0.2)", stroke: "rgb(34, 197, 94)" },
  { fill: "rgba(249, 115, 22, 0.2)", stroke: "rgb(249, 115, 22)" },
  { fill: "rgba(14, 165, 233, 0.2)", stroke: "rgb(14, 165, 233)" },
  { fill: "rgba(168, 85, 247, 0.2)", stroke: "rgb(168, 85, 247)" },
];

function getRandomColor() {
  return ELEMENT_COLORS[Math.floor(Math.random() * ELEMENT_COLORS.length)];
}

// =============================================================================
// DRAG PALETTE COMPONENT
// =============================================================================

interface DragPaletteProps {
  isVisible: boolean;
  onClose: () => void;
}

export function DragPalette({ isVisible, onClose }: DragPaletteProps) {
  // Position state (window coordinates, using left/top) - lazy initialized on client
  const [position, setPosition] = useState<Position>(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 176 : 0,
    y: 60,
  }));
  const [isDraggingPalette, setIsDraggingPalette] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Handle palette drag start
  const handlePaletteDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPalette(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  // Handle palette drag move and end (window-level events)
  useEffect(() => {
    if (!isDraggingPalette) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      let newX = dragStartRef.current.posX + deltaX;
      let newY = dragStartRef.current.posY + deltaY;

      // Constrain to window bounds
      const paletteWidth = paletteRef.current?.offsetWidth || 160;
      const paletteHeight = paletteRef.current?.offsetHeight || 250;

      newX = Math.max(0, Math.min(window.innerWidth - paletteWidth, newX));
      newY = Math.max(0, Math.min(window.innerHeight - paletteHeight, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingPalette(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPalette]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      ref={paletteRef}
      className="fixed z-20"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="bg-surface1/95 backdrop-blur-sm rounded-lg border border-border-subtle shadow-lg overflow-hidden">
        {/* Drag Handle Header */}
        <div
          className={cn(
            "flex items-center justify-between px-2 py-1.5 bg-surface2/50 border-b border-border-subtle",
            isDraggingPalette ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handlePaletteDragStart}
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3 h-3 text-text-muted" />
            <span className="text-xs font-medium text-text-muted select-none">
              Elements
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-surface3 rounded transition-colors"
            title="Close palette"
          >
            <X className="w-3 h-3 text-text-muted" />
          </button>
        </div>

        {/* Palette Items */}
        <div className="p-2">
          <div className="flex flex-col gap-1">
            {paletteItems.map((item) => (
              <DraggableItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DRAGGABLE ITEM
// =============================================================================

interface DraggableItemProps {
  item: DragItem;
}

function DraggableItem({ item }: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);

    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";

    // Create custom drag image
    const dragImage = document.createElement("div");
    dragImage.className = "bg-accent text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-lg";
    dragImage.textContent = item.label;
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 20);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab transition-colors",
        "hover:bg-surface2 active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="p-1 rounded bg-surface2">
        {item.icon}
      </div>
      <span className="text-sm text-text-primary">{item.label}</span>
    </div>
  );
}

// =============================================================================
// DROP ZONE HOOK
// =============================================================================

export function useCanvasDrop() {
  const { addElement, panX, panY, zoom } = useCanvasStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent, containerRect: DOMRect) => {
    e.preventDefault();
    setIsDragOver(false);

    const data = e.dataTransfer.getData("application/json");
    if (!data) return;

    try {
      const item: DragItem = JSON.parse(data);
      const color = getRandomColor();

      const dropX = e.clientX - containerRect.left;
      const dropY = e.clientY - containerRect.top;

      const canvasX = (dropX - panX) / zoom - item.defaultWidth / 2;
      const canvasY = (dropY - panY) / zoom - item.defaultHeight / 2;

      addElement({
        type: item.type,
        name: item.label,
        x: canvasX,
        y: canvasY,
        width: item.defaultWidth,
        height: item.defaultHeight,
        rotation: 0,
        fill: color.fill,
        stroke: color.stroke,
        strokeWidth: 2,
        locked: false,
        visible: true,
      });
    } catch (err) {
      console.error("Failed to parse drop data:", err);
    }
  };

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

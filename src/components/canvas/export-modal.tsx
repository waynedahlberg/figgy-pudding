"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  Copy,
  Check,
  Layers,
  Square,
} from "lucide-react";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import {
  elementsToSVG,
  downloadSVG,
  copySVGToClipboard,
  ExportOptions,
} from "@/lib/svg-export";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportScope = "all" | "selection";

// =============================================================================
// EXPORT MODAL
// =============================================================================

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { elements, selectedIds } = useCanvasStore();

  // Export settings state
  const [scope, setScope] = useState<ExportScope>("all");
  const [padding, setPadding] = useState(20);
  const [includeBackground, setIncludeBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [filename, setFilename] = useState("canvas-export");

  // UI state
  const [copied, setCopied] = useState(false);
  const [previewSVG, setPreviewSVG] = useState<string>("");

  // Determine if we have a selection
  const hasSelection = selectedIds.length > 0;
  const selectedCount = selectedIds.length;
  const totalCount = elements.filter((el) => el.visible).length;

  // Auto-switch to "all" if selection is cleared (use queueMicrotask to avoid cascading)
  useEffect(() => {
    if (!hasSelection && scope === "selection") {
      queueMicrotask(() => setScope("all"));
    }
  }, [hasSelection, scope]);

  // Generate preview SVG
  useEffect(() => {
    // Use queueMicrotask to defer all state updates
    queueMicrotask(() => {
      if (!isOpen) {
        setPreviewSVG("");
        return;
      }

      const options: ExportOptions = {
        padding,
        backgroundColor: includeBackground ? backgroundColor : undefined,
        includeHidden,
        selectedIds: scope === "selection" ? selectedIds : undefined,
      };

      const svg = elementsToSVG(elements, options);
      setPreviewSVG(svg);
    });
  }, [
    isOpen,
    elements,
    selectedIds,
    scope,
    padding,
    includeBackground,
    backgroundColor,
    includeHidden,
  ]);

  // Handle download
  const handleDownload = useCallback(() => {
    const options: ExportOptions = {
      padding,
      backgroundColor: includeBackground ? backgroundColor : undefined,
      includeHidden,
      selectedIds: scope === "selection" ? selectedIds : undefined,
    };

    const svg = elementsToSVG(elements, options);
    const exportFilename = `${filename || "canvas-export"}.svg`;
    downloadSVG(svg, exportFilename);
    onClose();
  }, [
    elements,
    selectedIds,
    scope,
    padding,
    includeBackground,
    backgroundColor,
    includeHidden,
    filename,
    onClose,
  ]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const options: ExportOptions = {
      padding,
      backgroundColor: includeBackground ? backgroundColor : undefined,
      includeHidden,
      selectedIds: scope === "selection" ? selectedIds : undefined,
    };

    const svg = elementsToSVG(elements, options);
    const success = await copySVGToClipboard(svg);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [
    elements,
    selectedIds,
    scope,
    padding,
    includeBackground,
    backgroundColor,
    includeHidden,
  ]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="bg-surface1 rounded-xl shadow-2xl border border-border-subtle overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      Export to SVG
                    </h2>
                    <p className="text-sm text-text-muted">
                      Download your design as a scalable vector graphic
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="flex">
                {/* Settings Panel */}
                <div className="w-64 border-r border-border-subtle p-4 space-y-6">
                  {/* Export Scope */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Export Scope
                    </label>
                    <div className="space-y-1">
                      <ScopeOption
                        icon={<Layers className="w-4 h-4" />}
                        label="All Elements"
                        description={`${totalCount} visible element${totalCount !== 1 ? "s" : ""}`}
                        selected={scope === "all"}
                        onClick={() => setScope("all")}
                      />
                      <ScopeOption
                        icon={<Square className="w-4 h-4" />}
                        label="Selection Only"
                        description={
                          hasSelection
                            ? `${selectedCount} selected`
                            : "No selection"
                        }
                        selected={scope === "selection"}
                        onClick={() => setScope("selection")}
                        disabled={!hasSelection}
                      />
                    </div>
                  </div>

                  {/* Padding */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Padding
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={padding}
                        onChange={(e) => setPadding(Number(e.target.value))}
                        className="flex-1 accent-accent"
                      />
                      <span className="text-sm text-text-primary w-12 text-right">
                        {padding}px
                      </span>
                    </div>
                  </div>

                  {/* Background */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Background
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeBackground}
                        onChange={(e) => setIncludeBackground(e.target.checked)}
                        className="w-4 h-4 rounded border-border-subtle accent-accent"
                      />
                      <span className="text-sm text-text-primary">
                        Include background
                      </span>
                    </label>
                    {includeBackground && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-8 h-8 rounded border border-border-subtle cursor-pointer"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs font-mono bg-surface2 border border-border-subtle rounded text-text-primary"
                        />
                      </div>
                    )}
                  </div>

                  {/* Include Hidden */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Visibility
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeHidden}
                        onChange={(e) => setIncludeHidden(e.target.checked)}
                        className="w-4 h-4 rounded border-border-subtle accent-accent"
                      />
                      <span className="text-sm text-text-primary">
                        Include hidden elements
                      </span>
                    </label>
                  </div>

                  {/* Filename */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Filename
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="canvas-export"
                        className="flex-1 px-3 py-2 text-sm bg-surface2 border border-border-subtle rounded-l-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <span className="px-3 py-2 text-sm bg-surface3 border border-l-0 border-border-subtle rounded-r-lg text-text-muted">
                        .svg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview Panel */}
                <div className="flex-1 p-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Preview
                  </label>
                  <div className="mt-2 bg-surface0 border border-border-subtle rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                    {previewSVG ? (
                      <div
                        className="max-w-full max-h-full p-4"
                        dangerouslySetInnerHTML={{ __html: previewSVG }}
                        style={{
                          // Checkerboard pattern for transparency
                          backgroundImage: !includeBackground
                            ? `linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                               linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                               linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                               linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)`
                            : undefined,
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }}
                      />
                    ) : (
                      <div className="text-text-muted text-sm">
                        No elements to export
                      </div>
                    )}
                  </div>

                  {/* Export info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span>
                      {scope === "selection"
                        ? `${selectedCount} element${selectedCount !== 1 ? "s" : ""}`
                        : `${totalCount} element${totalCount !== 1 ? "s" : ""}`}
                    </span>
                    <span>SVG • Vector Format</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface0/50">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface2 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy SVG</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download SVG
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// SCOPE OPTION COMPONENT
// =============================================================================

interface ScopeOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ScopeOption({
  icon,
  label,
  description,
  selected,
  onClick,
  disabled = false,
}: ScopeOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
        selected
          ? "bg-accent/10 border border-accent"
          : "bg-surface2 border border-transparent hover:border-border-subtle",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          selected ? "bg-accent text-white" : "bg-surface3 text-text-secondary"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium",
            selected ? "text-accent" : "text-text-primary"
          )}
        >
          {label}
        </div>
        <div className="text-xs text-text-muted truncate">{description}</div>
      </div>
      {selected && (
        <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

// =============================================================================
// HOOK FOR EXPORT MODAL
// =============================================================================

export function useExportModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openExportModal = useCallback(() => setIsOpen(true), []);
  const closeExportModal = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    openExportModal,
    closeExportModal,
  };
}

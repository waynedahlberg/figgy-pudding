"use client";

import { useState, ReactNode, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TopToolbar } from "@/components/toolbars/top-toolbar";
import { LeftSidebar } from "@/components/toolbars/left-sidebar";
import { BottomToolbar } from "@/components/toolbars/bottom-toolbar";
import { PropertiesPanel } from "@/components/canvas/properties-panel";
import { ExportModal } from "@/components/canvas/export-modal";
import { CanvasProvider } from "@/hooks/use-canvas-store";

// =============================================================================
// PALETTE CONTEXT
// =============================================================================

interface PaletteContextType {
  isPaletteVisible: boolean;
  setIsPaletteVisible: (visible: boolean) => void;
  togglePalette: () => void;
}

const PaletteContext = createContext<PaletteContextType | null>(null);

export function usePaletteVisibility() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("usePaletteVisibility must be used within AppLayout");
  }
  return context;
}

// =============================================================================
// PROPERTIES PANEL CONTEXT
// =============================================================================

interface PropertiesPanelContextType {
  isPropertiesPanelOpen: boolean;
  setIsPropertiesPanelOpen: (open: boolean) => void;
  togglePropertiesPanel: () => void;
}

const PropertiesPanelContext = createContext<PropertiesPanelContextType | null>(null);

export function usePropertiesPanel() {
  const context = useContext(PropertiesPanelContext);
  if (!context) {
    throw new Error("usePropertiesPanel must be used within AppLayout");
  }
  return context;
}

// =============================================================================
// LEFT SIDEBAR CONTEXT
// =============================================================================

interface LeftSidebarContextType {
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
}

const LeftSidebarContext = createContext<LeftSidebarContextType | null>(null);

export function useLeftSidebar() {
  const context = useContext(LeftSidebarContext);
  if (!context) {
    throw new Error("useLeftSidebar must be used within AppLayout");
  }
  return context;
}

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const togglePalette = () => setIsPaletteVisible((prev) => !prev);
  const togglePropertiesPanel = () => setIsPropertiesPanelOpen((prev) => !prev);
  const toggleLeftSidebar = () => setIsLeftSidebarOpen((prev) => !prev);
  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  return (
    <CanvasProvider>
      <PaletteContext.Provider value={{ isPaletteVisible, setIsPaletteVisible, togglePalette }}>
        <PropertiesPanelContext.Provider value={{ isPropertiesPanelOpen, setIsPropertiesPanelOpen, togglePropertiesPanel }}>
          <LeftSidebarContext.Provider value={{ isLeftSidebarOpen, setIsLeftSidebarOpen, toggleLeftSidebar }}>
            <div className="h-screen w-screen overflow-hidden flex flex-col bg-surface0">
              {/* Top Toolbar */}
              <header
                className="shrink-0 bg-surface1 border-b border-border-subtle"
                style={{ height: "var(--toolbar-height)" }}
              >
                <TopToolbar
                  isPaletteVisible={isPaletteVisible}
                  onTogglePalette={togglePalette}
                  isPropertiesPanelOpen={isPropertiesPanelOpen}
                  onTogglePropertiesPanel={togglePropertiesPanel}
                  isLeftSidebarOpen={isLeftSidebarOpen}
                  onToggleLeftSidebar={toggleLeftSidebar}
                  onExport={openExportModal}
                />
              </header>

              {/* Middle Section: Sidebar + Main Content + Properties Panel */}
              <div className="flex-1 flex min-h-0">
                {/* Left Sidebar - Animated */}
                <AnimatePresence initial={false} mode="sync">
                  {isLeftSidebarOpen && (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ 
                        width: "var(--sidebar-width)", 
                        opacity: 1,
                        transition: {
                          width: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 }
                        }
                      }}
                      exit={{ 
                        width: 0, 
                        opacity: 0,
                        transition: {
                          width: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="shrink-0 bg-surface1 border-r border-border-subtle overflow-hidden"
                    >
                      <div style={{ width: "var(--sidebar-width)" }} className="h-full">
                        <LeftSidebar />
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>

                {/* Main Viewport */}
                <main className="flex-1 min-w-0 overflow-hidden relative">
                  {children}
                </main>

                {/* Properties Panel - Animated */}
                <AnimatePresence initial={false} mode="sync">
                  {isPropertiesPanelOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ 
                        width: 256, 
                        opacity: 1,
                        transition: {
                          width: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 }
                        }
                      }}
                      exit={{ 
                        width: 0, 
                        opacity: 0,
                        transition: {
                          width: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="shrink-0 overflow-hidden"
                    >
                      <div style={{ width: 256 }} className="h-full">
                        <PropertiesPanel
                          isOpen={true}
                          onClose={() => setIsPropertiesPanelOpen(false)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Toolbar */}
              <footer
                className="shrink-0 bg-surface1 border-t border-border-subtle"
                style={{ height: "var(--statusbar-height)" }}
              >
                <BottomToolbar />
              </footer>
            </div>

            {/* Export Modal */}
            <ExportModal isOpen={isExportModalOpen} onClose={closeExportModal} />
          </LeftSidebarContext.Provider>
        </PropertiesPanelContext.Provider>
      </PaletteContext.Provider>
    </CanvasProvider>
  );
}

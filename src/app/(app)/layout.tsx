"use client";

import { useState, ReactNode } from "react";
import { TopToolbar } from "@/components/toolbars/top-toolbar";
import { LeftSidebar } from "@/components/toolbars/left-sidebar";
import { BottomToolbar } from "@/components/toolbars/bottom-toolbar";
import { PropertiesPanel } from "@/components/canvas/properties-panel";
import { CanvasProvider } from "@/hooks/use-canvas-store";

// Context for palette visibility (so canvas page can access it)
import { createContext, useContext } from "react";

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

// Context for properties panel
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

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);

  const togglePalette = () => setIsPaletteVisible((prev) => !prev);
  const togglePropertiesPanel = () => setIsPropertiesPanelOpen((prev) => !prev);

  return (
    <CanvasProvider>
      <PaletteContext.Provider value={{ isPaletteVisible, setIsPaletteVisible, togglePalette }}>
        <PropertiesPanelContext.Provider value={{ isPropertiesPanelOpen, setIsPropertiesPanelOpen, togglePropertiesPanel }}>
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
              />
            </header>

            {/* Middle Section: Sidebar + Main Content + Properties Panel */}
            <div className="flex-1 flex min-h-0">
              {/* Left Sidebar */}
              <aside
                className="shrink-0 bg-surface1 border-r border-border-subtle overflow-hidden"
                style={{ width: "var(--sidebar-width)" }}
              >
                <LeftSidebar />
              </aside>

              {/* Main Viewport */}
              <main className="flex-1 min-w-0 overflow-hidden relative">
                {children}
              </main>

              {/* Properties Panel (Right Side) */}
              <PropertiesPanel
                isOpen={isPropertiesPanelOpen}
                onClose={() => setIsPropertiesPanelOpen(false)}
              />
            </div>

            {/* Bottom Toolbar */}
            <footer
              className="shrink-0 bg-surface1 border-t border-border-subtle"
              style={{ height: "var(--statusbar-height)" }}
            >
              <BottomToolbar />
            </footer>
          </div>
        </PropertiesPanelContext.Provider>
      </PaletteContext.Provider>
    </CanvasProvider>
  );
}

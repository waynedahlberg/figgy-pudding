import { ReactNode } from "react";
import { TopToolbar } from "@/components/toolbars/top-toolbar";
import { LeftSidebar } from "@/components/toolbars/left-sidebar";
import { BottomToolbar } from "@/components/toolbars/bottom-toolbar";
import { CanvasProvider } from "@/hooks/use-canvas-store";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CanvasProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-surface0">
        {/* Top Toolbar */}
        <header 
          className="shrink-0 bg-surface1 border-b border-border-subtle"
          style={{ height: 'var(--toolbar-height)' }}
        >
          <TopToolbar />
        </header>

        {/* Middle Section: Sidebar + Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar */}
          <aside 
            className="shrink-0 bg-surface1 border-r border-border-subtle overflow-hidden"
            style={{ width: 'var(--sidebar-width)' }}
          >
            <LeftSidebar />
          </aside>

          {/* Main Viewport */}
          <main className="flex-1 min-w-0 overflow-hidden">
            {children}
          </main>
        </div>

        {/* Bottom Toolbar */}
        <footer 
          className="shrink-0 bg-surface1 border-t border-border-subtle"
          style={{ height: 'var(--statusbar-height)' }}
        >
          <BottomToolbar />
        </footer>
      </div>
    </CanvasProvider>
  );
}

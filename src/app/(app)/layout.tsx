import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-surface-0">
      {/* Top Toolbar */}
      <header className="h-[--spacing-toolbar-height] shrink-0 bg-surface-1 border-b border-border-subtle">
        <div className="h-full flex items-center px-3">
          <span className="text-sm text-text-secondary">Top Toolbar</span>
        </div>
      </header>

      {/* Middle Section: Sidebar + Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <aside className="w-[--spacing-sidebar-width] shrink-0 bg-surface-1 border-r border-border-subtle">
          <div className="p-3">
            <span className="text-sm text-text-secondary">Left Sidebar</span>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Bottom Toolbar */}
      <footer className="h-[--spacing-statusbar-height] shrink-0 bg-surface-1 border-t border-border-subtle">
        <div className="h-full flex items-center px-3">
          <span className="text-sm text-text-secondary">Bottom Toolbar</span>
        </div>
      </footer>
    </div>
  );
}
import { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-screen bg-surface0 flex flex-col">
      {/* Simple header with logo */}
      <header className="p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-primary hover:text-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-sm font-bold text-surface0">Z</span>
          </div>
          <span className="font-semibold">Zephyr</span>
        </Link>
      </header>

      {/* Centered content area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Simple footer */}
      <footer className="p-6 text-center text-sm text-text-muted">
        <p>© 2024 SuperInteresting Company. All rights reserved.</p>
      </footer>
    </div>
  );
}

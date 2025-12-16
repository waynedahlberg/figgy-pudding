"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Palette, Bell, Shield, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Settings navigation items
const settingsNav = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/account", label: "Account", icon: Shield },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex bg-surface0">
      {/* Settings Sidebar */}
      <div className="w-56 shrink-0 border-r border-border-subtle bg-surface1 flex flex-col">
        {/* Back to app link */}
        <div className="p-4 border-b border-border-subtle">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Canvas
          </Link>
        </div>

        {/* Settings title */}
        <div className="p-4 pb-2">
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-accent/20 text-accent"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface2"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

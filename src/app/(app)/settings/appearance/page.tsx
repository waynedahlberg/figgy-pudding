"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { SettingsSection, SettingsRow } from "@/components/shared/settings-section";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Appearance</h1>
        <p className="text-sm text-text-secondary mt-1">
          Customize how CanvasForge looks on your device
        </p>
      </div>

      {/* Theme selection */}
      <SettingsSection title="Theme" description="Select your preferred color scheme">
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  theme === t.id
                    ? "border-accent bg-accent/10"
                    : "border-border-subtle hover:border-border bg-surface0"
                )}
              >
                <t.icon className={cn(
                  "w-6 h-6",
                  theme === t.id ? "text-accent" : "text-text-secondary"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  theme === t.id ? "text-accent" : "text-text-primary"
                )}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Display options */}
      <SettingsSection title="Display">
        <SettingsRow
          label="Reduced motion"
          description="Reduce the amount of animations in the interface"
        >
          <ToggleSwitch
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
          />
        </SettingsRow>
        <SettingsRow
          label="Compact mode"
          description="Use smaller spacing and text throughout the app"
          isLast
        >
          <ToggleSwitch
            checked={compactMode}
            onCheckedChange={setCompactMode}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Canvas preferences */}
      <SettingsSection title="Canvas">
        <SettingsRow
          label="Show pixel grid at high zoom"
          description="Display pixel grid when zoomed in past 800%"
        >
          <ToggleSwitch checked={true} onCheckedChange={() => { }} />
        </SettingsRow>
        <SettingsRow
          label="Snap to pixel grid"
          description="Round positions to whole pixels when moving objects"
          isLast
        >
          <ToggleSwitch checked={true} onCheckedChange={() => { }} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

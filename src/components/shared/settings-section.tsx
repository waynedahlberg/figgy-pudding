import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-base font-medium text-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <div className="bg-surface1 rounded-lg border border-border-subtle">
        {children}
      </div>
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  isLast?: boolean;
}

export function SettingsRow({ label, description, children, isLast }: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4",
        !isLast && "border-b border-border-subtle"
      )}
    >
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        {description && (
          <div className="text-xs text-text-muted mt-0.5">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

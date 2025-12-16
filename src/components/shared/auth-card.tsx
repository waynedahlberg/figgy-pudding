import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="bg-surface1 rounded-xl border border-border-subtle shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>

      {/* Footer (optional) */}
      {footer && (
        <div className="px-6 py-4 bg-surface0/50 border-t border-border-subtle text-center text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}

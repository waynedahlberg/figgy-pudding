"use client";

import { forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  variant?: "default" | "accent" | "ghost";
  size?: "sm" | "md";
  onClick?: () => void;
}

const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      icon,
      label,
      shortcut,
      isActive = false,
      isDisabled = false,
      variant = "default",
      size = "md",
      onClick,
    },
    ref
  ) => {
    const tooltipText = shortcut ? `${label} (${shortcut})` : label;

    const sizeClasses = {
      sm: "w-7 h-7",
      md: "w-8 h-8",
    };

    const variantClasses = {
      default: cn(
        "text-text-secondary hover:text-text-primary hover:bg-surface2",
        isActive && "bg-surface3 text-accent"
      ),
      accent: "bg-accent/20 text-accent hover:bg-accent/30",
      ghost: "text-text-muted hover:text-text-secondary hover:bg-surface2",
    };

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              onClick={onClick}
              disabled={isDisabled}
              className={cn(
                "relative flex items-center justify-center rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface1",
                sizeClasses[size],
                variantClasses[variant],
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {icon}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

ToolbarButton.displayName = "ToolbarButton";

export { ToolbarButton };
export type { ToolbarButtonProps };
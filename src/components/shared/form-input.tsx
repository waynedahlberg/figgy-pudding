"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, type, className, ...props }, ref) => {
    // For password fields, track visibility toggle
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="space-y-1.5">
        {/* Label */}
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>

        {/* Input wrapper */}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-surface0 border border-border",
              "text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "transition-colors",
              isPassword && "pr-10", // Make room for toggle button
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />

          {/* Password visibility toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };

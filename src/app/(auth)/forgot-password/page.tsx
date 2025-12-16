"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/shared/auth-card";
import { FormInput } from "@/components/shared/form-input";
import { cn } from "@/lib/utils";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  // Form state
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
    setIsLoading(false);
  };

  // Success state - show confirmation message
  if (isSubmitted) {
    return (
      <AuthCard
        title="Check your email"
        footer={
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        }
      >
        <div className="text-center py-4">
          {/* Success icon */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-accent" />
          </div>

          <p className="text-text-secondary text-sm mb-4">
            We&apos;ve sent a password reset link to:
          </p>

          <p className="text-text-primary font-medium mb-4">{email}</p>

          <p className="text-text-muted text-xs">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-accent hover:underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      </AuthCard>
    );
  }

  // Form state - show email input
  return (
    <AuthCard
      title="Forgot password?"
      description="No worries, we'll send you reset instructions."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
            "bg-accent text-surface0 hover:bg-accent-hover",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface1",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}

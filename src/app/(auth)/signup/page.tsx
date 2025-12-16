"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/shared/auth-card";
import { FormInput } from "@/components/shared/form-input";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success - in real app, this would call your auth API
    console.log("Signup:", { name, email, password });
    
    // Redirect to app after successful signup
    router.push("/");
  };

  return (
    <AuthCard
      title="Create an account"
      description="Start designing with CanvasForge today"
      footer={
        <span className="text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Name field */}
        <FormInput
          label="Full name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          autoFocus
        />

        {/* Email field */}
        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        {/* Password field */}
        <FormInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        {/* Password requirements */}
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Password must contain:</p>
          <div className="grid grid-cols-2 gap-1">
            <PasswordCheck label="8+ characters" passed={passwordChecks.length} />
            <PasswordCheck label="Uppercase" passed={passwordChecks.uppercase} />
            <PasswordCheck label="Lowercase" passed={passwordChecks.lowercase} />
            <PasswordCheck label="Number" passed={passwordChecks.number} />
          </div>
        </div>

        {/* Terms agreement */}
        <p className="text-xs text-text-muted">
          By creating an account, you agree to our{" "}
          <Link href="#" className="text-accent hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

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
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}

// PASSWORD CHECK COMPONENT

function PasswordCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div
        className={cn(
          "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors",
          passed
            ? "bg-accent text-surface0"
            : "bg-surface2 text-text-muted"
        )}
      >
        {passed && <Check className="w-2.5 h-2.5" />}
      </div>
      <span className={passed ? "text-text-primary" : "text-text-muted"}>
        {label}
      </span>
    </div>
  );
}

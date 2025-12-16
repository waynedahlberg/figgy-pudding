"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { SettingsSection, SettingsRow } from "@/components/shared/settings-section";
import { FormInput } from "@/components/shared/form-input";
import { cn } from "@/lib/utils";

export default function ProfileSettingsPage() {
  // Form state
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [bio, setBio] = useState("Designer and maker of things.");
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Handle save
  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSaveMessage("Profile updated successfully!");
    setIsLoading(false);

    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your public profile information
        </p>
      </div>

      {/* Avatar section */}
      <SettingsSection title="Avatar" description="Click on the avatar to upload a new image">
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <button className="relative group">
              <div className="w-20 h-20 rounded-full bg-surface3 flex items-center justify-center text-2xl font-semibold text-text-primary">
                JD
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>

            <div>
              <p className="text-sm text-text-primary font-medium">Profile picture</p>
              <p className="text-xs text-text-muted mt-0.5">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Basic info section */}
      <SettingsSection title="Basic Information">
        <div className="p-4 space-y-4">
          <FormInput
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm resize-none",
                "bg-surface0 border border-border",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              )}
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-text-muted">
              Brief description for your profile. Max 160 characters.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            "bg-accent text-surface0 hover:bg-accent-hover",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface0",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save changes"
          )}
        </button>

        {saveMessage && (
          <span className="text-sm text-accent">{saveMessage}</span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SettingsSection, SettingsRow } from "@/components/shared/settings-section";
import { FormInput } from "@/components/shared/form-input";
import { cn } from "@/lib/utils";

export default function AccountSettingsPage() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setIsChangingPassword(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setPasswordMessage({ type: "success", text: "Password updated successfully" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(false);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    // In real app, this would call API and redirect to goodbye page
    console.log("Account deleted");
    alert("Account deletion would happen here");
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Account</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account security and settings
        </p>
      </div>

      {/* Password change */}
      <SettingsSection
        title="Change Password"
        description="Update your password to keep your account secure"
      >
        <div className="p-4 space-y-4">
          <FormInput
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />

          <FormInput
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />

          <FormInput
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />

          {passwordMessage && (
            <p
              className={cn(
                "text-sm",
                passwordMessage.type === "success" ? "text-accent" : "text-red-500"
              )}
            >
              {passwordMessage.text}
            </p>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-accent text-surface0 hover:bg-accent-hover",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isChangingPassword ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </span>
            ) : (
              "Update password"
            )}
          </button>
        </div>
      </SettingsSection>

      {/* Sessions */}
      <SettingsSection
        title="Active Sessions"
        description="Manage your active sessions across devices"
      >
        <SettingsRow
          label="Current session"
          description="Chrome on macOS · San Francisco, CA"
        >
          <span className="text-xs text-accent bg-accent/20 px-2 py-1 rounded">
            Active now
          </span>
        </SettingsRow>
        <SettingsRow
          label="iPhone 15 Pro"
          description="Safari on iOS · Last active 2 hours ago"
          isLast
        >
          <button className="text-xs text-red-500 hover:underline">
            Revoke
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection title="Danger Zone">
        <div className="p-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-500">Delete account</h3>
              <p className="text-xs text-text-secondary mt-1">
                Once you delete your account, there is no going back. All your
                projects, settings, and data will be permanently removed.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-3 px-3 py-1.5 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete account
                </button>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-text-primary">
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm bg-surface0 border border-border text-text-primary"
                    placeholder="Type DELETE"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE"}
                      className="px-3 py-1.5 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Permanently delete
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                      className="px-3 py-1.5 rounded text-sm font-medium bg-surface2 text-text-primary hover:bg-surface3 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

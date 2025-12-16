"use client";

import { useState } from "react";
import { SettingsSection, SettingsRow } from "@/components/shared/settings-section";
import { ToggleSwitch } from "@/components/shared/toggle-switch";

export default function NotificationsSettingsPage() {
  // Email notifications
  const [emailComments, setEmailComments] = useState(true);
  const [emailMentions, setEmailMentions] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);

  // Push notifications
  const [pushComments, setPushComments] = useState(true);
  const [pushMentions, setPushMentions] = useState(true);
  const [pushReminders, setPushReminders] = useState(true);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Notifications</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage how you receive notifications
        </p>
      </div>

      {/* Email notifications */}
      <SettingsSection
        title="Email Notifications"
        description="Choose what emails you want to receive"
      >
        <SettingsRow
          label="Comments"
          description="When someone comments on your designs"
        >
          <ToggleSwitch
            checked={emailComments}
            onCheckedChange={setEmailComments}
          />
        </SettingsRow>
        <SettingsRow
          label="Mentions"
          description="When someone mentions you in a comment"
        >
          <ToggleSwitch
            checked={emailMentions}
            onCheckedChange={setEmailMentions}
          />
        </SettingsRow>
        <SettingsRow
          label="Product updates"
          description="News about product and feature updates"
        >
          <ToggleSwitch
            checked={emailUpdates}
            onCheckedChange={setEmailUpdates}
          />
        </SettingsRow>
        <SettingsRow
          label="Marketing emails"
          description="Tips, tutorials, and promotional content"
          isLast
        >
          <ToggleSwitch
            checked={emailMarketing}
            onCheckedChange={setEmailMarketing}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Push notifications */}
      <SettingsSection
        title="Push Notifications"
        description="Notifications sent to your browser or device"
      >
        <SettingsRow
          label="Comments"
          description="When someone comments on your designs"
        >
          <ToggleSwitch
            checked={pushComments}
            onCheckedChange={setPushComments}
          />
        </SettingsRow>
        <SettingsRow
          label="Mentions"
          description="When someone mentions you"
        >
          <ToggleSwitch
            checked={pushMentions}
            onCheckedChange={setPushMentions}
          />
        </SettingsRow>
        <SettingsRow
          label="Reminders"
          description="Task and deadline reminders"
          isLast
        >
          <ToggleSwitch
            checked={pushReminders}
            onCheckedChange={setPushReminders}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

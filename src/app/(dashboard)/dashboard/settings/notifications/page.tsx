import type { Metadata } from "next";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Notification",
};

export default function NotificationSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Notification"
        description="Choose how Rate'O reaches you. Saved on this device."
      />
      <NotificationSettings />
    </PageContainer>
  );
}

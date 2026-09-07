import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <PageContainer>
      <NotificationsList />
    </PageContainer>
  );
}

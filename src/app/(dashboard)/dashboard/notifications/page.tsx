import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <PageContainer>
      <PageHeader title="Notifications" description="Everything that happened while you were away." />
      <EmptyState
        icon={Bell}
        title="Notifications"
        description="Coming in Phase 4/5."
      />
    </PageContainer>
  );
}

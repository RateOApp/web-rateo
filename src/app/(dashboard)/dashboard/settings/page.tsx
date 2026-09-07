import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" description="Account, password and notification preferences." />
      <EmptyState
        icon={Settings}
        title="Settings"
        description="Coming in Phase 4/5."
      />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "My jobs",
};

export default function MyJobsPage() {
  return (
    <PageContainer>
      <PageHeader title="My jobs" description="Applications you have sent and their status." />
      <EmptyState
        icon={Briefcase}
        title="My jobs"
        description="Coming in Phase 4."
      />
    </PageContainer>
  );
}

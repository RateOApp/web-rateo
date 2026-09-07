import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Saved jobs",
};

export default function SavedJobsPage() {
  return (
    <PageContainer>
      <PageHeader title="Saved jobs" description="Roles you liked and want to come back to." />
      <EmptyState
        icon={Bookmark}
        title="Saved jobs"
        description="Coming in Phase 4."
      />
    </PageContainer>
  );
}

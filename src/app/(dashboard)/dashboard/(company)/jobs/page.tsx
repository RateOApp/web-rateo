import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Job posts",
};

export default function CompanyJobsPage() {
  return (
    <PageContainer>
      <PageHeader title="Job posts" description="Manage the roles your company has posted." />
      <EmptyState
        icon={Briefcase}
        title="Job posts"
        description="Coming in Phase 5."
      />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Candidates",
};

export default function CandidatesPage() {
  return (
    <PageContainer>
      <PageHeader title="Candidates" description="Talent that matches your open roles." />
      <EmptyState
        icon={Users}
        title="Candidates"
        description="Coming in Phase 5."
      />
    </PageContainer>
  );
}

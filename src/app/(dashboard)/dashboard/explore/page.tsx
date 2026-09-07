import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Explore",
};

export default function ExplorePage() {
  return (
    <PageContainer>
      <PageHeader title="Explore" description="Search jobs, companies and talent." />
      <EmptyState
        icon={Compass}
        title="Explore"
        description="Coming in Phase 4/5."
      />
    </PageContainer>
  );
}

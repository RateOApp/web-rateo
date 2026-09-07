import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Ratings",
};

export default function RatingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Ratings" description="Your monthly ratings and the scores you have given." />
      <EmptyState
        icon={Star}
        title="Ratings"
        description="Coming in Phase 4/5."
      />
    </PageContainer>
  );
}

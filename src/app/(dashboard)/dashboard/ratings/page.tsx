import type { Metadata } from "next";
import { Star } from "lucide-react";
import { IndividualRatings } from "@/components/ratings/individual-ratings";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Ratings",
};

/** Shared route: individuals get the full screen, companies land in Phase 5. */
export default async function RatingsPage() {
  const user = await getCachedUser();

  if (user?.role === "company") {
    return (
      <PageContainer>
        <PageHeader
          title="Ratings"
          description="Your company rating and the ratings you give your team."
        />
        <EmptyState
          icon={Star}
          title="Company ratings"
          description="Company ratings arrive in Phase 5."
        />
      </PageContainer>
    );
  }

  return <IndividualRatings />;
}

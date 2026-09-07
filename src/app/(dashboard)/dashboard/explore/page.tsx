import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { ExploreIndividual } from "@/components/explore/explore-individual";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Explore",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [user, { q }] = await Promise.all([getCachedUser(), searchParams]);
  if (!user) redirect("/login");

  if (user.role === "company") {
    return (
      <PageContainer>
        <PageHeader title="Explore" description="Search companies and talent." />
        <EmptyState
          icon={Compass}
          title="Explore"
          description="The company view of Explore arrives in Phase 5."
        />
      </PageContainer>
    );
  }

  return <ExploreIndividual user={user} query={q} />;
}

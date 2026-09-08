import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanyExplore } from "@/components/company/explore/company-explore";
import { ExploreIndividual } from "@/components/explore/explore-individual";
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

  if (user.role === "company") return <CompanyExplore user={user} query={q} />;

  return <ExploreIndividual user={user} query={q} />;
}

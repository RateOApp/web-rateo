import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { IndividualHome } from "@/components/feed/individual-home";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardHomePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  if (user.role === "company") {
    return (
      <PageContainer>
        <PageHeader
          title={`Welcome back, ${user.companyName?.trim() || "there"}`}
          description="Your candidates, job posts and company rating live here."
        />
        <EmptyState
          icon={Sparkles}
          title="Your candidate feed"
          description="Company home arrives in Phase 5."
        />
      </PageContainer>
    );
  }

  return <IndividualHome user={user} />;
}

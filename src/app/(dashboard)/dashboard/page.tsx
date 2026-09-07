import type { Metadata } from "next";
import { Compass, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardHomePage() {
  const user = await getCachedUser();
  const isCompany = user?.role === "company";
  const name =
    (isCompany ? user?.companyName : user?.firstName) ?? "there";

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${name}`}
        description={
          isCompany
            ? "Your candidates, job posts and company rating live here."
            : "Your job feed, applications and ratings live here."
        }
        actions={<VerifiedBadge status={user?.kycStatus} />}
      />
      <EmptyState
        icon={isCompany ? Sparkles : Compass}
        title={isCompany ? "Your candidate feed" : "Your job feed"}
        description="Your feed arrives in Phase 4/5."
      />
    </PageContainer>
  );
}

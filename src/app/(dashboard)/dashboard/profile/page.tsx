import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IndividualProfile } from "@/components/profile/individual-profile";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Profile",
};

/** Shared route: individuals get the full profile, companies a Phase 5 stub. */
export default async function ProfilePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  if (user.role === "company") {
    return (
      <PageContainer>
        <PageHeader title="Profile" description="Your Rate’O profile as others see it." />
        <EmptyState
          icon={Building2}
          title="Company profile"
          description="Company profile arrives in Phase 5."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <IndividualProfile user={user} />
    </PageContainer>
  );
}

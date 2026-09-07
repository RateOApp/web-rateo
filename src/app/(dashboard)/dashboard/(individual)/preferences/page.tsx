import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { JobPreferencesWizard } from "@/components/profile/job-preferences-wizard";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Job preferences",
};

export default async function JobPreferencesPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="Job preferences"
        description="What we should put in front of you."
      />
      <JobPreferencesWizard user={user} />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Update skills",
};

export default async function UpdateSkillsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="Update skills"
        description="Employers see them in this order, so lead with your strongest."
      />
      <SkillsEditor user={user} />
    </PageContainer>
  );
}

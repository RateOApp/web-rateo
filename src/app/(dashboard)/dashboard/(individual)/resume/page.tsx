import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ResumePanel } from "@/components/profile/resume-panel";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "My resume",
};

export default async function ResumePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="My resume"
        description="Your CV and the profile summary employers see with it."
      />
      <ResumePanel user={user} />
    </PageContainer>
  );
}

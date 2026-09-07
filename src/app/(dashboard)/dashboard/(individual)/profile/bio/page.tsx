import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { BioForm } from "@/components/profile/bio-form";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Update bio",
};

export default async function EditBioPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="Update bio"
        description="A short introduction, up to 100 words."
      />
      <BioForm user={user} />
    </PageContainer>
  );
}

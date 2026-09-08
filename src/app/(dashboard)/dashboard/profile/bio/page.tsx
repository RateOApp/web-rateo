import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { BioForm } from "@/components/profile/bio-form";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Update bio",
};

/**
 * Shared route. Same 100-word editor for both roles, but they write different
 * columns: individuals `bio`, companies `description` (what candidates read on
 * the public company page).
 */
export default async function EditBioPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const isCompany = user.role === "company";

  return (
    <PageContainer>
      <PageHeader
        title={isCompany ? "About your company" : "Update bio"}
        description={
          isCompany
            ? "What candidates read about you, up to 100 words."
            : "A short introduction, up to 100 words."
        }
      />
      <BioForm user={user} field={isCompany ? "description" : "bio"} />
    </PageContainer>
  );
}

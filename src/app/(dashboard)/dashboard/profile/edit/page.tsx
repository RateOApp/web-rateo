import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EditCompanyProfileForm } from "@/components/company/profile/edit-company-profile-form";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Edit profile",
};

/** Shared route: the two roles edit different fields, behind the same gates. */
export default async function EditProfilePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const isCompany = user.role === "company";

  return (
    <PageContainer>
      <PageHeader
        title="Edit profile"
        description={
          isCompany
            ? "Your logo, company details and contact information."
            : "Your name, photo and contact details."
        }
      />
      {isCompany ? <EditCompanyProfileForm user={user} /> : <EditProfileForm user={user} />}
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default async function EditProfilePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="Edit profile"
        description="Your name, photo and contact details."
      />
      <EditProfileForm user={user} />
    </PageContainer>
  );
}

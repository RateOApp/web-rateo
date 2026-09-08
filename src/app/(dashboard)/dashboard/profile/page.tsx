import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { CompanyProfile } from "@/components/company/profile/company-profile";
import { IndividualProfile } from "@/components/profile/individual-profile";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Profile",
};

/** Shared route: each role sees its own profile at the same URL. */
export default async function ProfilePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      {user.role === "company" ? (
        <CompanyProfile user={user} />
      ) : (
        <IndividualProfile user={user} />
      )}
    </PageContainer>
  );
}

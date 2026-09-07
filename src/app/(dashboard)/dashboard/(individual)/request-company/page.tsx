import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { RequestCompany } from "@/components/profile/request-company";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Join a company",
};

export default async function RequestCompanyPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="Join a company"
        description="Link your employer so your ratings and work history stay connected."
      />
      <RequestCompany user={user} />
    </PageContainer>
  );
}

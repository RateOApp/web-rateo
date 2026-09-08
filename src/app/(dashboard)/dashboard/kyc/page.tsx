import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { CompanyKyc } from "@/components/company/kyc/company-kyc";
import { KycIntro } from "@/components/kyc/kyc-intro";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "KYC",
};

/**
 * Shared route. Both roles verify at the same URL because everything around it
 * links here (the KYC banner, the gate dialog, the profile pill), but the two
 * flows share nothing beyond the status card: an individual proves a person
 * with NIN and a selfie, a company proves a business with CAC documents and a
 * signed authorization.
 */
export default async function KycPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const isCompany = user.role === "company";

  return (
    <PageContainer>
      <PageHeader
        title="KYC"
        description={
          isCompany
            ? "Verify your business to unlock candidate profiles and messages."
            : "Verify your identity to unlock jobs, messages and ratings."
        }
      />
      {isCompany ? <CompanyKyc user={user} /> : <KycIntro user={user} />}
    </PageContainer>
  );
}

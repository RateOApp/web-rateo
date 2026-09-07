import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { KycIntro } from "@/components/kyc/kyc-intro";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "KYC",
};

export default async function KycPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <PageContainer>
      <PageHeader
        title="KYC"
        description="Verify your identity to unlock jobs, messages and ratings."
      />
      <KycIntro user={user} />
    </PageContainer>
  );
}

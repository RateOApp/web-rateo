import type { Metadata } from "next";
import { CandidatesHub } from "@/components/company/candidates/candidates-hub";
import { parseCandidatesTab } from "@/components/company/candidates/candidates-tab";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return (
    <PageContainer>
      <CandidatesHub initialTab={parseCandidatesTab(tab)} />
    </PageContainer>
  );
}

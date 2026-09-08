import type { Metadata } from "next";
import { CandidatesHub, parseCandidatesTab } from "@/components/company/candidates/candidates-hub";
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

import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SavedTabs } from "@/components/saved/saved-tabs";
import { parseSavedTab } from "@/components/saved/saved-tab";

export const metadata: Metadata = {
  title: "Saved",
};

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return (
    <PageContainer>
      <PageHeader
        title="Saved"
        description="Applications you have sent, roles you want to come back to, and imported jobs you asked to hear about."
      />
      <SavedTabs initialTab={parseSavedTab(tab)} />
    </PageContainer>
  );
}

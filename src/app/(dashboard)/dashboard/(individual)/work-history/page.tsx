import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { WorkHistoryList } from "@/components/work-history/work-history-list";

export const metadata: Metadata = {
  title: "Work history",
};

export default function WorkHistoryPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Work history"
        description="Every role you have held, and how each contract ended."
      />
      <WorkHistoryList />
    </PageContainer>
  );
}

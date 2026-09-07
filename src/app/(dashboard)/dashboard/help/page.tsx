import type { Metadata } from "next";
import { FaqList } from "@/components/support/faq-list";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Help and support",
};

export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Help and support"
        description="Answers to the questions we get asked most."
      />
      <FaqList />
    </PageContainer>
  );
}

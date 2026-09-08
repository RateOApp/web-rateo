import type { Metadata } from "next";
import { NewReportButton } from "@/components/support/new-report-button";
import { TicketThread } from "@/components/support/ticket-thread";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Problem",
};

export default async function SupportTicketPage({
  params,
}: PageProps<"/dashboard/support/[id]">) {
  const { id } = await params;

  return (
    <PageContainer>
      <PageHeader
        title="Problem"
        description="Our team replies here. Keep the conversation in this thread."
        actions={<NewReportButton />}
      />
      <TicketThread ticketId={id} />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { TicketThread } from "@/components/support/ticket-thread";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

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
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/report?new=1">New report</Link>
          </Button>
        }
      />
      <TicketThread ticketId={id} />
    </PageContainer>
  );
}

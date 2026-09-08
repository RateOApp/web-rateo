import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EditJob } from "@/components/company/jobs/edit-job";
import { isObjectId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit job",
};

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Edit job"
          description="Update the posting, close it, or take it down."
        />
        <EditJob jobId={id} />
      </div>
    </PageContainer>
  );
}

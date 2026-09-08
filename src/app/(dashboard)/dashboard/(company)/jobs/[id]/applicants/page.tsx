import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicantsList } from "@/components/company/jobs/applicants-list";
import { isObjectId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Applicants",
};

export default async function JobApplicantsPage({
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
          title="Applicants"
          description="Review who applied, then accept or decline them."
        />
        <ApplicantsList jobId={id} />
      </div>
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TalentDetail } from "@/components/company/talent/talent-detail";
import { isObjectId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Talent details",
};

export default async function TalentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ job?: string; from?: string; employee?: string }>;
}) {
  const [{ id }, { job, employee }] = await Promise.all([params, searchParams]);
  if (!isObjectId(id)) notFound();

  return (
    <TalentDetail
      candidateId={id}
      jobId={job && isObjectId(job) ? job : undefined}
      employeeHint={employee === "1"}
    />
  );
}

import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { MyJobsList, PostJobButton } from "@/components/company/jobs/my-jobs-list";

export const metadata: Metadata = {
  title: "My jobs",
};

export default function CompanyJobsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="My jobs"
        description="Every role you have posted, and who has applied."
        actions={<PostJobButton />}
      />
      <MyJobsList />
    </PageContainer>
  );
}

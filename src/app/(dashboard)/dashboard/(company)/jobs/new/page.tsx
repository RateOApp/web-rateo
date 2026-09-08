import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { PostJob } from "@/components/company/jobs/post-job";

export const metadata: Metadata = {
  title: "Post a job opening",
};

export default function PostJobPage() {
  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Post a job opening"
          description="Tell candidates what the role is and who you are looking for."
        />
        <PostJob />
      </div>
    </PageContainer>
  );
}

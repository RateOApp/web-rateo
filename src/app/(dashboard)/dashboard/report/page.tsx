import { Suspense } from "react";
import type { Metadata } from "next";
import { ReportForm } from "@/components/support/report-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Report a problem",
};

export default function ReportProblemPage() {
  return (
    <PageContainer>
      <PageHeader title="Report a problem" />
      {/* `useSearchParams()` (the `?new=1` flag) needs a boundary. */}
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-xl rounded-2xl" />}>
        <ReportForm />
      </Suspense>
    </PageContainer>
  );
}

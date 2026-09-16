import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClaimLoading() {
  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-white p-6 sm:p-8">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="mt-4 h-8 w-4/5" />
        <Skeleton className="mt-3 h-4 w-2/3" />
        <Skeleton className="mt-1.5 h-4 w-1/2" />

        <Skeleton className="mt-6 h-24 w-full rounded-2xl" />

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>

        <div className="mt-6 grid gap-2.5 border-t border-border pt-5 sm:grid-cols-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}

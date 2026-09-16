import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function JoinLoading() {
  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-white p-6 sm:p-8">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="mt-4 h-8 w-4/5" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />

        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-cream-50 p-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>

        <div className="mt-6 flex justify-center border-t border-border pt-5">
          <Skeleton className="h-11 w-48 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}

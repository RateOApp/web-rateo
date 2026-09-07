import { PageContainer } from "@/components/layout/page-container";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobsLoading() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />

      <div className="mt-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      <CardListSkeleton className="mt-6" />
    </PageContainer>
  );
}

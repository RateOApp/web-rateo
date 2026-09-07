import { PageContainer } from "@/components/layout/page-container";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />
      <CardListSkeleton className="mt-6" />
    </PageContainer>
  );
}

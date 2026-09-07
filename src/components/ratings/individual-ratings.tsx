"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyRatingTab } from "@/components/ratings/company-rating-tab";
import { MyRatingTab } from "@/components/ratings/my-rating-tab";
import { PageContainer } from "@/components/layout/page-container";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/hooks/use-me";
import { useParticipationOf } from "@/hooks/use-participation";
import { useUserReviews } from "@/hooks/use-reviews";
import { toDate } from "@/lib/format";
import { companiesService } from "@/services/companies";
import type { ReviewItem } from "@/types/reviews";

/** A review written by `reviewerId` in the current calendar month. */
function ratedThisMonthBy(reviews: ReviewItem[], reviewerId: string | undefined): boolean {
  if (!reviewerId) return false;
  const now = new Date();
  return reviews.some((review) => {
    const reviewer = review.reviewer;
    const id = typeof reviewer === "string" ? reviewer : reviewer?._id;
    if (!id || String(id) !== String(reviewerId)) return false;
    const created = toDate(review.createdAt);
    return (
      created !== null &&
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  });
}

/**
 * `/dashboard/ratings` for individuals: how employers rate them, and how their
 * current employer is rated.
 */
export function IndividualRatings() {
  const [tab, setTab] = useState("my");
  const { data: me, isPending: mePending } = useMe();

  const myId = me?._id;
  const employer = me?.experience?.find((entry) => entry.current && entry.companyId);
  const companyId = employer?.companyId;

  const myReviews = useUserReviews(myId);

  const companyQuery = useQuery({
    queryKey: ["company", companyId ?? ""] as const,
    queryFn: () => companiesService.byId(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const companyReviews = useUserReviews(companyId);
  const participation = useParticipationOf(companyId);

  const ratedThisMonth = useMemo(
    () => ratedThisMonthBy(companyReviews.data?.reviews ?? [], myId),
    [companyReviews.data, myId],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Ratings"
        description="How your employers rate you, and how your company is rated."
      />

      {mePending || !me ? (
        <CardListSkeleton rows={3} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="my">My Rating</TabsTrigger>
            <TabsTrigger value="company">Company&apos;s Rating</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-4">
            <MyRatingTab
              user={me}
              summary={myReviews.data}
              isLoading={myReviews.isPending}
            />
          </TabsContent>

          <TabsContent value="company" className="mt-4">
            <CompanyRatingTab
              company={companyQuery.data ?? null}
              summary={companyReviews.data}
              isLoading={companyQuery.isPending || companyReviews.isPending}
              participationScore={
                typeof participation.data?.participationScore === "number"
                  ? participation.data.participationScore
                  : null
              }
              participationStatus={participation.data?.participationStatus ?? null}
              ratedThisMonth={ratedThisMonth}
            />
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}

"use client";

import { useState } from "react";
import { FeedbackCard } from "@/components/dashboard/feedback-card";
import {
  MetricsBars,
  metricsFromBreakdown,
} from "@/components/ratings/metrics-bars";
import { ReviewCard } from "@/components/ratings/review-card";
import { ReviewDetailDialog } from "@/components/ratings/review-detail-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar, displayName } from "@/components/shared/user-avatar";
import { formatRating } from "@/lib/rating";
import { INDIVIDUAL_CRITERIA } from "@/lib/rating-criteria";
import { toDate } from "@/lib/format";
import type { User } from "@/types/api";
import type { ReviewItem, ReviewsSummary } from "@/types/reviews";

type MyRatingTabProps = {
  user: User;
  summary: ReviewsSummary | undefined;
  isLoading: boolean;
};

/** How employers have rated the signed-in individual. */
export function MyRatingTab({ user, summary, isLoading }: MyRatingTabProps) {
  const [openReview, setOpenReview] = useState<ReviewItem | null>(null);

  if (isLoading && !summary) {
    return <CardListSkeleton rows={3} />;
  }

  const average = summary?.averageRating ?? 0;
  const total = summary?.totalReviews ?? 0;
  const rows = metricsFromBreakdown(INDIVIDUAL_CRITERIA, summary?.detailsBreakdown);

  const reviews = [...(summary?.reviews ?? [])].sort(
    (a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0),
  );

  const jobTitle =
    user.experience?.find((entry) => entry.current)?.title?.trim() ||
    user.experience?.[0]?.title?.trim() ||
    "Individual";

  return (
    <div className="flex flex-col gap-4">
      <FeedbackCard
        average={average}
        total={total}
        loading={isLoading}
        className="rounded-2xl border border-border bg-white p-5"
      />

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
        <UserAvatar user={user} size="lg" className="data-[size=lg]:size-14" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-brand-900">
            {displayName(user)}
          </p>
          <p className="truncate text-sm text-muted-foreground">{jobTitle}</p>
          <p className="mt-1 flex items-center gap-1.5">
            <span className="text-lg font-bold text-brand-900">
              {formatRating(average)}
            </span>
            <StarRating value={average} size={18} />
          </p>
        </div>
      </section>

      <MetricsBars rows={rows} />

      {reviews.length ? (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review._id}>
              <ReviewCard review={review} variant="about-me" onOpen={setOpenReview} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          No reviews yet.
        </p>
      )}

      <ReviewDetailDialog
        review={openReview}
        onOpenChange={(open) => {
          if (!open) setOpenReview(null);
        }}
      />
    </div>
  );
}

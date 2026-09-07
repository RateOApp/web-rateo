"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { ParticipationStatCard } from "@/components/dashboard/participation-stat-card";
import {
  MetricsBars,
  metricsFromBreakdown,
} from "@/components/ratings/metrics-bars";
import { RateCta } from "@/components/ratings/rate-cta";
import { ReviewCard } from "@/components/ratings/review-card";
import {
  HIDDEN_STILL_EMPLOYED,
  ReviewDetailDialog,
} from "@/components/ratings/review-detail-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toDate } from "@/lib/format";
import { COMPANY_CRITERIA } from "@/lib/rating-criteria";
import { formatRating } from "@/lib/rating";
import type { ParticipationStatus, User } from "@/types/api";
import type { ReviewItem, ReviewsSummary } from "@/types/reviews";

type CompanyRatingTabProps = {
  /** `null` when the user has no current employer with a `companyId`. */
  company: User | null;
  summary: ReviewsSummary | undefined;
  isLoading: boolean;
  participationScore: number | null;
  participationStatus: ParticipationStatus | null;
  ratedThisMonth: boolean;
};

/** How the signed-in individual's employer is rated. */
export function CompanyRatingTab({
  company,
  summary,
  isLoading,
  participationScore,
  participationStatus,
  ratedThisMonth,
}: CompanyRatingTabProps) {
  const [openReview, setOpenReview] = useState<ReviewItem | null>(null);

  if (!company) {
    return (
      <EmptyState
        icon={Building2}
        title="You do not work for any company yet"
        description="When you join a company on Rateo, their ratings will appear here."
      />
    );
  }

  if (isLoading && !summary) {
    return <CardListSkeleton rows={3} />;
  }

  const average = summary?.averageRating ?? 0;
  const rows = metricsFromBreakdown(COMPANY_CRITERIA, summary?.detailsBreakdown);
  const reviews = [...(summary?.reviews ?? [])].sort(
    (a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Verbatim from mobile's RatingFeedbackCard type="privacy". */}
      <section className="rounded-2xl bg-brand-50 p-5">
        <p className="text-base font-bold text-brand-900">Relax 🙃</p>
        <p className="mt-1 text-sm text-brand-900/80">
          Your employers can&apos;t see the ratings &amp; comments you give till you leave
          the company.
        </p>
      </section>

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
        <UserAvatar
          user={company}
          size="lg"
          className="data-[size=lg]:size-14"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-brand-900">
            {company.companyName?.trim() || "Company"}
          </p>
          {company.industry ? (
            <p className="truncate text-sm text-muted-foreground">{company.industry}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-1.5">
            <span className="text-lg font-bold text-brand-900">
              {formatRating(average)}
            </span>
            <StarRating value={average} size={18} />
          </p>
        </div>
      </section>

      <ParticipationStatCard
        rating={average}
        score={participationScore}
        status={participationStatus}
      />

      <MetricsBars rows={rows} emptyLabel="No metrics available yet." />

      <RateCta ratedThisMonth={ratedThisMonth} />

      {reviews.length ? (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review._id}>
              <ReviewCard
                review={review}
                variant="about-company"
                onOpen={setOpenReview}
              />
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
        hiddenEmployeeCopy={HIDDEN_STILL_EMPLOYED}
        onOpenChange={(open) => {
          if (!open) setOpenReview(null);
        }}
      />
    </div>
  );
}

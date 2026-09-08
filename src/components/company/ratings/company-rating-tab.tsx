'use client';

import { useState } from 'react';

import { ContractEndCard } from '@/components/company/ratings/contract-end-card';
import { ParticipationStatCard } from '@/components/dashboard/participation-stat-card';
import { MetricsBars, metricsFromBreakdown } from '@/components/ratings/metrics-bars';
import { ReviewCard } from '@/components/ratings/review-card';
import {
  HIDDEN_STILL_EMPLOYED,
  ReviewDetailDialog,
} from '@/components/ratings/review-detail-dialog';
import { CardListSkeleton } from '@/components/shared/card-list-skeleton';
import { StarRating } from '@/components/shared/star-rating';
import { UserAvatar } from '@/components/shared/user-avatar';
import { companyFeedback } from '@/lib/company-feedback';
import { toDate } from '@/lib/format';
import { formatRating } from '@/lib/rating';
import { COMPANY_CRITERIA } from '@/lib/rating-criteria';
import type { ParticipationStatus, User } from '@/types/api';
import type { ReviewItem, ReviewsSummary } from '@/types/reviews';

type CompanyRatingTabProps = {
  company: User;
  summary: ReviewsSummary | undefined;
  isLoading: boolean;
  participationScore: number | null;
  participationStatus: ParticipationStatus | null;
};

/**
 * How the company's own staff rate it.
 *
 * Reviews from people who still work here stay sealed until the contract ends -
 * that is the whole reason employees are willing to write them, so the card
 * says so explicitly rather than quietly omitting the row.
 */
export function CompanyRatingTab({
  company,
  summary,
  isLoading,
  participationScore,
  participationStatus,
}: CompanyRatingTabProps) {
  const [openReview, setOpenReview] = useState<ReviewItem | null>(null);

  if (isLoading && !summary) return <CardListSkeleton rows={3} />;

  const average = summary?.averageRating ?? 0;
  const total = summary?.totalReviews ?? 0;
  const feedback = companyFeedback(average, total);
  const rows = metricsFromBreakdown(COMPANY_CRITERIA, summary?.detailsBreakdown);
  const reviews = [...(summary?.reviews ?? [])].sort(
    (a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0),
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-brand-50 p-5">
        <p className="text-base font-bold text-brand-900">{feedback.title}</p>
        <p className="mt-1 text-sm text-brand-900/80">{feedback.subtitle}</p>
      </section>

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
        <UserAvatar user={company} size="lg" className="data-[size=lg]:size-14 rounded-2xl" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-brand-900">
            {company.companyName?.trim() || 'Company'}
          </p>
          {company.industry ? (
            <p className="truncate text-sm text-muted-foreground">{company.industry}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-1.5">
            <span className="text-lg font-bold text-brand-900">{formatRating(average)}</span>
            <StarRating value={average} size={18} />
          </p>
        </div>
      </section>

      <ParticipationStatCard
        rating={average}
        score={participationScore}
        status={participationStatus}
      />

      <MetricsBars rows={rows} />

      <ContractEndCard companyId={company._id} />

      {reviews.length ? (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review._id}>
              <ReviewCard review={review} variant="about-my-company" onOpen={setOpenReview} />
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

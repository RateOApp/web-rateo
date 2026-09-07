import type { Review } from '@/types/api';

/** A review as returned by `GET /reviews/:userId` (read-time flags included). */
export type ReviewItem = Review & {
  target?: string;
  job?: string | null;
  category?: string;
  /** Set server-side when the target individual is participation-overdue. */
  commentHidden?: boolean;
  hiddenReason?: 'PARTICIPATION_OVERDUE' | (string & {});
  updatedAt?: string;
};

/** Normalised shape of `GET /reviews/:userId`. */
export type ReviewsSummary = {
  reviews: ReviewItem[];
  averageRating: number;
  totalReviews: number;
  /** Averages per canonical criterion label. */
  detailsBreakdown: Record<string, number>;
};

/** `GET /reviews/status/monthly` */
export type MonthlyPromptStatus = {
  shouldPrompt: boolean;
  reason?: 'outside_rating_window' | 'no_current_employer' | 'no_employees' | (string & {});
  outstandingCount?: number;
};

/** `POST /reviews` body. */
export type CreateReviewPayload = {
  targetId: string;
  rating: number;
  details: Record<string, number>;
  comment: string;
  category: 'company_review' | 'employee_review';
  jobId?: string;
};

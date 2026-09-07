import { api } from '@/lib/api/client';
import type { Review } from '@/types/api';
import type {
  CreateReviewPayload,
  MonthlyPromptStatus,
  ReviewItem,
  ReviewsSummary,
} from '@/types/reviews';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * `GET /reviews/:userId` returns `{ reviews, averageRating, totalReviews,
 * detailsBreakdown }` on the current server, and a bare array on older ones.
 * Always hand callers the object form.
 */
export function normaliseReviewsSummary(data: unknown): ReviewsSummary {
  if (Array.isArray(data)) {
    const reviews = data as ReviewItem[];
    const rated = reviews.filter((r) => typeof r.rating === 'number');
    const averageRating = rated.length
      ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 100) / 100
      : 0;
    return { reviews, averageRating, totalReviews: reviews.length, detailsBreakdown: {} };
  }
  if (isRecord(data)) {
    const reviews = Array.isArray(data.reviews) ? (data.reviews as ReviewItem[]) : [];
    const averageRating = typeof data.averageRating === 'number' ? data.averageRating : 0;
    const totalReviews =
      typeof data.totalReviews === 'number' ? data.totalReviews : reviews.length;
    const detailsBreakdown = isRecord(data.detailsBreakdown)
      ? Object.fromEntries(
          Object.entries(data.detailsBreakdown).filter(
            (entry): entry is [string, number] => typeof entry[1] === 'number',
          ),
        )
      : {};
    return { reviews, averageRating, totalReviews, detailsBreakdown };
  }
  return { reviews: [], averageRating: 0, totalReviews: 0, detailsBreakdown: {} };
}

export const reviewsService = {
  /** Reviews written ABOUT `userId` (an individual or a company). */
  async byUser(userId: string): Promise<ReviewsSummary> {
    const { data } = await api.get<unknown>(`/reviews/${encodeURIComponent(userId)}`);
    return normaliseReviewsSummary(data);
  },

  async monthlyStatus(): Promise<MonthlyPromptStatus> {
    const { data } = await api.get<MonthlyPromptStatus>('/reviews/status/monthly');
    return data;
  },

  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await api.post<Review>('/reviews', payload);
    return data;
  },
};

import { toDate } from '@/lib/format';
import type { ReviewItem } from '@/types/reviews';

export type ReviewMonthGroup = {
  key: string;
  label: string;
  reviews: ReviewItem[];
  hiddenCount: number;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const UNDATED_KEY = 'undated';

/**
 * Groups reviews (expected newest first) by local year+month of `createdAt`.
 * Groups come newest month first, with an "Undated" group last. Order inside a
 * group follows the input order.
 */
export function groupReviewsByMonth(reviews: ReviewItem[]): ReviewMonthGroup[] {
  const map = new Map<string, ReviewMonthGroup>();

  for (const review of reviews) {
    const date = toDate(review.createdAt);
    const key = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : UNDATED_KEY;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        label: date ? `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}` : 'Undated',
        reviews: [],
        hiddenCount: 0,
      };
      map.set(key, group);
    }
    group.reviews.push(review);
    if (review.isCurrentEmployee || review.commentHidden) group.hiddenCount += 1;
  }

  return [...map.values()].sort((a, b) => {
    if (a.key === UNDATED_KEY) return 1;
    if (b.key === UNDATED_KEY) return -1;
    return a.key < b.key ? 1 : a.key > b.key ? -1 : 0;
  });
}

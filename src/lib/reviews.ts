import type { Review } from "@/types/api";

/** Days a review stays sealed after the employment ends. Mirrors the server rule. */
export const REVIEW_REVEAL_DELAY_DAYS = 14;

/**
 * Note shown under a "Review Hidden" heading. Employee-written reviews also say the
 * employee's name stays private.
 */
export function hiddenReviewCopy(review?: Pick<Review, 'reviewer'> | null): string {
  const reviewer = review?.reviewer;
  return reviewer?.role === 'individual' || reviewer?.anonymous
    ? 'This comment becomes visible after employment ends. The employee’s name stays private.'
    : 'This comment becomes visible after employment ends.';
}

/** Company-side copy for a still-employed reviewer's sealed rating. */
export const stillEmployedCopy = hiddenReviewCopy;

/** Aggregate subtitle, e.g. `"2 Hidden until employment ends"`. */
export function hiddenCountSubtitle(count: number): string {
  return `${count} Hidden until employment ends`;
}

/** Setup explainer sentence. */
export const REVIEW_HIDDEN_EXPLAINER =
  'While you are still employed you can see your overall rating, but written comments stay hidden until the employment ends — on both sides.';

/** Shown instead of an employee's name on reviews they wrote about a company. */
export const ANONYMOUS_EMPLOYEE_LABEL = 'Verified former employee';

/** Name and avatar to show for a review's author. Individuals are always anonymous. */
export function reviewerDisplay(review: Pick<Review, 'reviewer'>): {
  name: string;
  avatar: string | null;
  anonymous: boolean;
} {
  const reviewer = review.reviewer;
  if (reviewer?.role === 'individual' || reviewer?.anonymous) {
    return { name: ANONYMOUS_EMPLOYEE_LABEL, avatar: null, anonymous: true };
  }
  const person = [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(' ').trim();
  return {
    name: reviewer?.displayName?.trim() || reviewer?.companyName?.trim() || person || 'Company',
    avatar: reviewer?.avatar || null,
    anonymous: false,
  };
}

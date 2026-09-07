/**
 * Tiered copy for "how are my reviews doing?" cards. Ported from
 * app-rateo's UserHomeScreen / RatingScreen so home, profile and the ratings
 * tab all describe the same average the same way.
 */

export type RatingFeedback = { title: string; subtitle: string };

const NO_REVIEWS: RatingFeedback = {
  title: 'No ratings yet',
  subtitle: 'Build your profile by getting reviews.',
};

const BREAKDOWN_SUBTITLE = 'Click to see a breakdown of your reviews.';

export function ratingFeedback(
  average: number | null | undefined,
  total: number | null | undefined,
): RatingFeedback {
  if (!total || typeof average !== 'number' || !Number.isFinite(average)) return NO_REVIEWS;

  const title =
    average >= 4.5
      ? 'Your feedback is great!'
      : average >= 3.5
        ? 'Your feedback is positive'
        : average >= 2.5
          ? 'Mixed feedback'
          : average >= 1.5
            ? 'Needs improvement'
            : 'Significant concerns noted';

  return { title, subtitle: BREAKDOWN_SUBTITLE };
}

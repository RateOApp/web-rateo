import type { ParticipationStatus, Review, User } from '@/types/api';

/* -------------------------------------------------------------------------- */
/* Criteria                                                                   */
/* -------------------------------------------------------------------------- */

/** Fixed display order for the criteria an employee scores a company on. */
export const COMPANY_CRITERIA = [
  'Salary',
  'Career Growth',
  'Management',
  'Work Environment',
  'Fairness',
] as const;

/**
 * Criteria were renamed in Aug 2026; reviews written before then still carry
 * the old keys. Mirrors `app-rateo/src/utils/ratingCriteria.js` (and the same
 * table in `server-rateo/src/controllers/reviewController.js`).
 */
const LEGACY_CRITERIA_ALIASES: Record<string, string> = {
  Punctuality: 'Behaviour',
  Professionalism: 'Management',
  Safety: 'Work Environment',
  'Duty of care': 'Fairness',
};

export function canonicalCriterion(label: string): string {
  const key = label.trim();
  return LEGACY_CRITERIA_ALIASES[key] ?? key;
}

export type CriterionAverage = { label: string; average: number; known: boolean };

/**
 * Averages `review.details` across reviews, folding legacy keys onto their
 * current labels. Unlike the mobile app (which divides every criterion by the
 * number of reviews that carried *any* details, diluting scores) each label is
 * divided by the number of reviews that actually scored it.
 */
export function criteriaAverages(reviews: Review[]): CriterionAverage[] {
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const review of reviews) {
    for (const [rawLabel, rawValue] of Object.entries(review.details ?? {})) {
      const value = Number(rawValue);
      if (!Number.isFinite(value)) continue;
      const label = canonicalCriterion(rawLabel);
      sums.set(label, (sums.get(label) ?? 0) + value);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  const known: CriterionAverage[] = [];
  for (const label of COMPANY_CRITERIA) {
    const count = counts.get(label);
    if (!count) continue;
    known.push({ label, average: (sums.get(label) ?? 0) / count, known: true });
  }

  const extra: CriterionAverage[] = [];
  for (const [label, count] of counts) {
    if ((COMPANY_CRITERIA as readonly string[]).includes(label)) continue;
    extra.push({ label, average: (sums.get(label) ?? 0) / count, known: false });
  }
  extra.sort((a, b) => a.label.localeCompare(b.label));

  return [...known, ...extra];
}

/* -------------------------------------------------------------------------- */
/* Averages / display                                                         */
/* -------------------------------------------------------------------------- */

export const NO_RATING = '—';

export function hasRating(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** `4.75 -> "4.8"`, nothing -> "—". Never flashes a misleading "0.0". */
export function formatRating(value: number | null | undefined): string {
  return hasRating(value) ? value.toFixed(1) : NO_RATING;
}

/** Mean of `review.rating`; `0` when there is nothing to average. */
export function averageRating(reviews: Review[]): number {
  const scores = reviews
    .map((review) => Number(review.rating))
    .filter((value) => Number.isFinite(value));
  if (!scores.length) return 0;
  return scores.reduce((total, value) => total + value, 0) / scores.length;
}

/** Counts of 5,4,3,2,1-star reviews, in that order. */
export function ratingDistribution(reviews: Review[]): { stars: number; count: number }[] {
  const buckets = new Map<number, number>([
    [5, 0],
    [4, 0],
    [3, 0],
    [2, 0],
    [1, 0],
  ]);
  for (const review of reviews) {
    const stars = Math.round(Number(review.rating));
    if (buckets.has(stars)) buckets.set(stars, (buckets.get(stars) ?? 0) + 1);
  }
  return [...buckets].map(([stars, count]) => ({ stars, count }));
}

/* -------------------------------------------------------------------------- */
/* Participation                                                              */
/* -------------------------------------------------------------------------- */

const PARTICIPATION_LABELS: Record<string, string> = {
  not_established: 'New',
  current: 'Active',
  grace: 'Grace period',
  overdue: 'Overdue',
};

/** Neutral chip label for `user.participationStatus`. */
export function participationLabel(status: ParticipationStatus | undefined): string | null {
  if (!status) return null;
  return PARTICIPATION_LABELS[status] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Ranking                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 50/50 blend of rating and participation, mirroring `topRatedScore` in
 * `app-rateo/src/utils/rating.js`. A missing participation score counts as 100
 * ("has not missed anything yet"), so only genuinely lapsed accounts sink.
 */
export function topRatedScore(
  rating: number | null | undefined,
  participationScore: number | null | undefined,
): number {
  const ratingNorm = (Math.max(0, Math.min(5, Number(rating) || 0)) / 5) * 100;
  const participation =
    typeof participationScore === 'number' ? Math.max(0, Math.min(100, participationScore)) : 100;
  return 0.5 * ratingNorm + 0.5 * participation;
}

/** Descending comparator with deterministic tie-breaks. */
export function compareTopRated(a: User, b: User): number {
  const scoreB = topRatedScore(b.overallRating, b.participationScore);
  const scoreA = topRatedScore(a.overallRating, a.participationScore);
  if (scoreB !== scoreA) return scoreB - scoreA;
  if ((b.overallRating ?? 0) !== (a.overallRating ?? 0)) {
    return (b.overallRating ?? 0) - (a.overallRating ?? 0);
  }
  return (b.participationScore ?? 100) - (a.participationScore ?? 100);
}

/* -------------------------------------------------------------------------- */
/* KYC                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * `GET /users/:id` returns a normalised `kyc.status` ('approved' | 'pending' |
 * 'rejected' | 'unverified') while list endpoints return the raw `kycStatus`
 * ('verified' | ...). `VerifiedBadge` speaks the raw vocabulary, so fold both.
 */
export function kycBadgeStatus(user: {
  kycStatus?: string;
  kyc?: { status?: string };
}): 'none' | 'pending' | 'verified' | 'rejected' {
  const raw = (user.kyc?.status ?? user.kycStatus ?? '').toLowerCase();
  if (raw === 'verified' || raw === 'approved') return 'verified';
  if (raw === 'pending') return 'pending';
  if (raw === 'rejected') return 'rejected';
  return 'none';
}

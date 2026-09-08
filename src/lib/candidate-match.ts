import { candidateTitle, type Candidate, type CandidatePreferences } from '@/types/candidates';

/**
 * Client-side "% match" between a candidate and the signed-in company.
 *
 * Ported from `computeCandidateMatch` in app-rateo's `CompanyHomeScreen.js` so
 * the same candidate scores the same on web and mobile. Weights:
 *
 * | signal    | weight | rule                                                    |
 * |-----------|--------|---------------------------------------------------------|
 * | skills    | 40     | overlap with `roles` / candidate skill count             |
 * | location  | 25     | exact 25, substring either way 18                        |
 * | minRating | 20     | at or above 20, within half a star 10                    |
 * | title     | 15     | any preferred role appears in the candidate's job title  |
 *
 * The mobile version reads the company's own `location` for the 25 % slice;
 * here the caller folds that into `prefs.location` (see `companyMatchPrefs`),
 * which also honours the explicit "Candidate Location" preference.
 */

function lower(values: readonly string[] | undefined | null): string[] {
  return Array.isArray(values) ? values.map((value) => String(value).toLowerCase().trim()) : [];
}

export function computeCandidateMatch(
  candidate: Candidate,
  prefs: CandidatePreferences | null | undefined,
): number {
  const preferences = prefs ?? {};
  let score = 0;

  // Skills vs preferred roles/skills (40%).
  const candidateSkills = lower(candidate.skills);
  const preferredRoles = lower(preferences.roles);
  if (candidateSkills.length > 0 && preferredRoles.length > 0) {
    const overlap = candidateSkills.filter((skill) => preferredRoles.includes(skill));
    score += (overlap.length / Math.max(candidateSkills.length, 1)) * 40;
  }

  // Location (25%).
  const preferredLocation = (preferences.location ?? '').toLowerCase().trim();
  const candidateLocation = (candidate.location ?? '').toLowerCase().trim();
  if (preferredLocation && candidateLocation) {
    if (preferredLocation === candidateLocation) {
      score += 25;
    } else if (
      candidateLocation.includes(preferredLocation) ||
      preferredLocation.includes(candidateLocation)
    ) {
      score += 18;
    }
  }

  // Minimum applicant rating (20%).
  const rating = candidate.overallRating;
  if (typeof preferences.minRating === 'number' && typeof rating === 'number') {
    if (rating >= preferences.minRating) score += 20;
    else if (rating >= preferences.minRating - 0.5) score += 10;
  }

  // Current/desired role alignment (15%).
  const title = (candidateTitle(candidate) ?? '').toLowerCase();
  if (preferredRoles.length > 0 && title) {
    if (preferredRoles.some((role) => role && title.includes(role))) score += 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * The preferences a company matches with: the saved `candidatePreferences`,
 * with the company's own `location` standing in when no candidate location has
 * been chosen (mirrors the mobile screen, which only ever reads `user.location`).
 */
export function companyMatchPrefs(user: {
  location?: string;
  candidatePreferences?: Record<string, unknown>;
}): CandidatePreferences {
  const raw = (user.candidatePreferences ?? {}) as CandidatePreferences;
  return {
    location: raw.location?.trim() || user.location || undefined,
    minRating: typeof raw.minRating === 'number' ? raw.minRating : undefined,
    roles: Array.isArray(raw.roles) ? raw.roles : undefined,
  };
}

/** Best match first. Stable for equal scores (Array#sort is stable in ES2019+). */
export function sortByCandidateMatch(
  candidates: Candidate[],
  prefs: CandidatePreferences | null | undefined,
): { candidate: Candidate; match: number }[] {
  return candidates
    .map((candidate) => ({ candidate, match: computeCandidateMatch(candidate, prefs) }))
    .sort((a, b) => b.match - a.match);
}

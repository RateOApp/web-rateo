import { isImportedJob, type AnyJob, type User } from '@/types/api';

/**
 * Client-side "% match" between a job and the signed-in individual.
 *
 * Ported verbatim from `computeJobMatch` in app-rateo's `UserHomeScreen.js` so
 * the same job scores the same on web and mobile. Weights:
 *
 * | signal   | weight | rule                                                     |
 * |----------|--------|----------------------------------------------------------|
 * | skills   | 40     | overlap / job skills count                                |
 * | title    | 30     | exact 30, substring either way 22, else token ratio x 30  |
 * | location | 15     | exact 15, substring either way 10                         |
 * | salary   | 15     | job.minSalary inside the preferred band 15, +/-20% 10     |
 *
 * Imported listings always score 0: they carry no skills, no numeric salary
 * and no company account, so any score would be noise.
 */

export type MatchableUser = Pick<User, 'role' | 'skills' | 'location' | 'jobPreferences'>;

function lower(values: string[] | undefined | null): string[] {
  return Array.isArray(values) ? values.map((value) => String(value).toLowerCase()) : [];
}

export function computeJobMatch(job: AnyJob, user: MatchableUser | null | undefined): number {
  if (!user || user.role !== 'individual') return 0;
  if (isImportedJob(job)) return 0;

  const preferences = user.jobPreferences ?? {};
  let score = 0;

  // Skills overlap (40%)
  const userSkills = lower(user.skills);
  const jobSkills = lower(job.skills);
  if (userSkills.length > 0 && jobSkills.length > 0) {
    const overlap = userSkills.filter((skill) => jobSkills.includes(skill));
    score += (overlap.length / Math.max(jobSkills.length, 1)) * 40;
  }

  // Job title (30%)
  const preferredTitle = (preferences.jobTitle ?? '').toLowerCase().trim();
  const jobTitle = (job.title ?? '').toLowerCase().trim();
  if (preferredTitle && jobTitle) {
    if (jobTitle === preferredTitle) {
      score += 30;
    } else if (jobTitle.includes(preferredTitle) || preferredTitle.includes(jobTitle)) {
      score += 22;
    } else {
      const tokens = preferredTitle.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        const matched = tokens.filter((token) => jobTitle.includes(token));
        score += (matched.length / tokens.length) * 30;
      }
    }
  }

  // Location (15%)
  const preferredLocation = (preferences.location || user.location || '').toLowerCase().trim();
  const jobLocation = (job.location ?? '').toLowerCase().trim();
  if (preferredLocation && jobLocation) {
    if (jobLocation === preferredLocation) {
      score += 15;
    } else if (
      jobLocation.includes(preferredLocation) ||
      preferredLocation.includes(jobLocation)
    ) {
      score += 10;
    }
  }

  // Salary (15%)
  const hasBand =
    typeof preferences.minSalary === 'number' || typeof preferences.maxSalary === 'number';
  if (typeof job.minSalary === 'number' && hasBand) {
    const desiredMin =
      typeof preferences.minSalary === 'number' ? preferences.minSalary : job.minSalary;
    const desiredMax =
      typeof preferences.maxSalary === 'number' ? preferences.maxSalary : job.minSalary;
    if (job.minSalary >= desiredMin && job.minSalary <= desiredMax) {
      score += 15;
    } else if (job.minSalary >= desiredMin * 0.8 && job.minSalary <= desiredMax * 1.2) {
      score += 10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Best match first. Stable for equal scores (Array#sort is stable in ES2019+). */
export function sortByMatch(
  jobs: AnyJob[],
  user: MatchableUser | null | undefined,
): { job: AnyJob; match: number }[] {
  return jobs
    .map((job) => ({ job, match: computeJobMatch(job, user) }))
    .sort((a, b) => b.match - a.match);
}

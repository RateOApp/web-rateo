/**
 * Types for the company dashboard's candidate surfaces (home feed, explore,
 * candidates hub, talent detail, candidate preferences).
 *
 * Kept out of `@/types/api.ts` so the three Phase-5 workstreams never edit the
 * same file. Source of truth: `server-rateo/src/controllers/userController.js`
 * (`getCompanyEmployees`, `getSavedCandidates`, `getCompanyPreferences`).
 */

import type { Experience, User } from '@/types/api';

/**
 * An `experience` entry as it comes back from `GET /users/:id`. The public
 * `Experience` type only covers what the contract documents; the ending fields
 * below are written by the employment-end flows and are read-only here.
 */
export type TalentExperience = Experience & {
  isVerified?: boolean;
  endedBy?: 'employee' | 'company' | string | null;
  endMethod?: 'notice' | 'immediate' | string | null;
  noticeDays?: number | null;
};

/* -------------------------------------------------------------------------- */
/* Candidate preferences (`/users/company/preferences`)                       */
/* -------------------------------------------------------------------------- */

/**
 * `GET /users/company/preferences` answers with `user.candidatePreferences`,
 * which is `{}` on a fresh account - every field is therefore optional.
 */
export type CandidatePreferences = {
  location?: string;
  minRating?: number;
  roles?: string[];
};

/** Body of `PUT /users/company/preferences`. */
export type UpdateCandidatePreferencesPayload = {
  location: string;
  minRating: number;
  roles: string[];
};

/** Defaults the mobile screen starts from when the account has none saved. */
export const DEFAULT_CANDIDATE_PREFERENCES: UpdateCandidatePreferencesPayload = {
  location: 'Lagos',
  minRating: 2,
  roles: [],
};

/** Options offered by the "Candidate Location" select. */
export const CANDIDATE_LOCATIONS = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Remote',
] as const;

/* -------------------------------------------------------------------------- */
/* Employees (`/users/company/employees`)                                     */
/* -------------------------------------------------------------------------- */

/** Pending notice on an employment, surfaced by `getCompanyEmployees`. */
export type EmployeeNotice = {
  effectiveDate?: string | null;
  noticeDays?: number | null;
  /** Who started the ending. */
  givenBy?: 'company' | 'employee' | string | null;
  reason?: string | null;
};

/**
 * One row of `GET /users/company/employees`. NOTE the projection: the id field
 * is `id` (not `_id`) and `role` is the JOB TITLE at this company, not the
 * account role.
 */
export type CompanyEmployee = {
  id: string;
  name?: string;
  role?: string;
  avatar?: string;
  rating?: number;
  /** `false` once this company has rated the employee in the current month. */
  ratingRequired?: boolean;
  notice?: EmployeeNotice | null;
};

/** A not-yet-approved "I work here" claim. `status` is server-side copy. */
export type EmployeeClaimRequest = CompanyEmployee & { status?: string };

export type CompanyEmployeesResponse = {
  employees: CompanyEmployee[];
  requests: EmployeeClaimRequest[];
};

export type VerifyEmployeeAction = 'approve' | 'reject';

/* -------------------------------------------------------------------------- */
/* Candidates                                                                 */
/* -------------------------------------------------------------------------- */

/** A candidate is just a `User` with `role === 'individual'`. */
export type Candidate = User;

/**
 * The candidate's job title: current experience entry first, then the newest
 * entry, then the standalone field. **Job Seeker** is the display fallback and
 * is deliberately NOT part of the match signal.
 */
export function candidateTitle(candidate: Candidate): string | null {
  const experience = candidate.experience ?? [];
  const current = experience.find((entry) => entry?.current);
  const title = current?.title ?? experience[0]?.title ?? candidate.jobTitle;
  return title?.trim() || null;
}

/** Same lookup, with the display fallback applied. */
export function candidateTitleLabel(candidate: Candidate): string {
  return candidateTitle(candidate) ?? 'Job Seeker';
}

/** `firstName lastName`, falling back to the company name and then a generic. */
export function candidateName(candidate: Candidate): string {
  const person = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim();
  return person || candidate.companyName?.trim() || 'Unnamed candidate';
}

/** Ratings arrive as `overallRating` on lists and `averageRating` on some rows. */
export function candidateRating(
  candidate: Candidate & { averageRating?: number },
): number | null {
  const value = candidate.overallRating ?? candidate.averageRating;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

/** Where a notification takes a COMPANY when tapped (see COMPANY_DASHBOARD.md). */
export const COMPANY_NOTIFICATION_ROUTES: Record<string, string> = {
  application: '/dashboard/candidates',
  message: '/dashboard/messages',
  rating: '/dashboard/ratings',
  kyc: '/dashboard/profile',
  account: '/dashboard/profile',
  system: '/dashboard/employees',
  employment: '/dashboard/employees',
};

export const COMPANY_NOTIFICATION_FALLBACK_ROUTE = '/dashboard';

/**
 * Ids this account has blocked. `/auth/verify-token` returns the raw user
 * document, which carries `blockedUsers`, but it is not part of the public
 * `User` contract - so it is read defensively here rather than widened there.
 */
export function blockedUserIds(user: User | null | undefined): string[] {
  const raw = (user as (User & { blockedUsers?: unknown }) | null | undefined)?.blockedUsers;
  return Array.isArray(raw) ? raw.map((id) => String(id)) : [];
}

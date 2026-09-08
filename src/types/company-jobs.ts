/**
 * Company-side job types: the create/update body and the applicants list.
 * Source of truth: `server-rateo/src/controllers/jobController.js`
 * (`createJob`, `updateJob`, `getJobApplicants`, `updateApplicantStatus`).
 */

import type { GenderPreference, JobStatus } from '@/types/api';

/**
 * Body of `POST /jobs` and `PUT /jobs/:id`.
 *
 * `deadline: null` means "Indefinite". Salaries are omitted entirely when the
 * company leaves them blank - `updateJob` uses `req.body.x || job.x`, so a `0`
 * or an empty string would silently keep the previous value anyway.
 * `status` is only ever sent from the edit form.
 */
export type JobPayload = {
  title: string;
  type: string;
  workArrangement: string;
  location: string;
  skills: string[];
  minSalary?: number;
  maxSalary?: number;
  description: string;
  tasks: string[];
  perks: string[];
  deadline: string | null;
  minRating: number;
  /** One of `INDUSTRIES` - the server rejects anything else. */
  category: string;
  genderPreference: GenderPreference;
  status?: JobStatus;
};

/** The three statuses this UI writes. Older rows may carry other values. */
export type ApplicantStatus = 'pending' | 'accepted' | 'rejected' | (string & {});

/**
 * The applicant projection `getJobApplicants` populates: a trimmed user plus a
 * derived `title` (current experience title, then `jobPreferences.jobTitle`)
 * and an `overallRating` computed in one aggregate.
 */
export type JobApplicantProfile = {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  skills?: string[];
  resume?: string;
  overallRating?: number;
  title?: string;
};

/**
 * One row of `GET /jobs/:id/applicants`. `applicant` can be `null` when the
 * account behind an application has been deleted, so every consumer must
 * filter before rendering.
 */
export type JobApplicantRow = {
  _id?: string;
  applicant: JobApplicantProfile | null;
  status?: ApplicantStatus;
  appliedAt?: string;
};

/** `GET /jobs/company/myjobs` answers a bare array; some builds wrap it. */
export type MyJobsResponse = { jobs?: unknown } | unknown[];

import type { ApiMessage } from '@/types/api';

/**
 * Imported-job claim flow (server-rateo `importedJobsController`). An employer
 * follows a tokenised link mailed to them when their listing was scraped from
 * an external board; claiming it links the listing to their company account.
 */

export type ClaimReason = 'not_found' | 'expired' | 'unavailable';

/**
 * `GET imported-jobs/claim/:token/info` — public, always answers 200. A bad,
 * expired or already-resolved token is NOT an error, it is `{ valid: false }`.
 */
export type ClaimInfo =
  | {
      valid: true;
      jobTitle?: string;
      companyName?: string;
      location?: string;
      employmentType?: string;
      interestCount?: number;
      status?: string;
    }
  | {
      valid: false;
      reason?: ClaimReason;
    };

/**
 * `POST imported-jobs/claim/:token` — auth required, company role only.
 * Refusals (wrong role, expired, unavailable, not found) come back as a
 * non-2xx `ApiError` whose body is this same `{ message }` shape.
 */
export type ClaimResponse = ApiMessage;

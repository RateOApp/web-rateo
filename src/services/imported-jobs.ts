import { api } from '@/lib/api/client';
import type { ClaimResponse } from '@/types/imported-jobs';

/**
 * Imported-jobs API, browser half. Mirrors `referrals.ts`: a plain function on
 * the same-origin `/api` proxy, with the TanStack wrapper in
 * `@/hooks/use-imported-jobs`.
 *
 * Public lookup (`GET .../info`) lives server-side only, in
 * `@/services/imported-jobs.server` - `/claim/[token]` always renders it from
 * an RSC so the token state is never stale behind the client cache.
 */
export const importedJobsService = {
  /**
   * `POST imported-jobs/claim/:token`. Requires a company session; the
   * backend answers 403 for an individual and 400/404 for an expired,
   * unavailable or unknown token - all surfaced as `ApiError` for the caller
   * to read `message` from.
   */
  claimListing(token: string): Promise<ClaimResponse> {
    return api
      .post<ClaimResponse>(`/imported-jobs/claim/${encodeURIComponent(token)}`)
      .then((r) => r.data);
  },
};

import { serverFetch, type ServerFetchInit } from '@/lib/api/server';
import type { ClaimInfo } from '@/types/imported-jobs';

/**
 * RSC half of the imported-jobs API - only the public claim lookup, which is
 * what `/claim/[token]` renders from. Split from `importedJobsService` because
 * `@/lib/api/server` imports `server-only`.
 */
export const importedJobsServer = {
  /** `GET imported-jobs/claim/:token/info`, unauthenticated. */
  async claimInfo(token: string, init?: ServerFetchInit): Promise<ClaimInfo> {
    return serverFetch<ClaimInfo>(`imported-jobs/claim/${encodeURIComponent(token)}/info`, init);
  },
};

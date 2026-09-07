import { serverFetch, type ServerFetchInit } from '@/lib/api/server';
import { jobListQuery, toSearchString, type JobListParams } from '@/services/params';
import type { AnyJob, JobCategoriesResponse, JobsResponse } from '@/types/api';

export type { JobListParams } from '@/services/params';

/**
 * RSC / route-handler jobs API. Talks to the backend directly through
 * `serverFetch`. Split from `jobsService` because `@/lib/api/server` imports
 * `server-only`, which must never enter a client bundle.
 *
 * Pass `{ auth: false }` for build-time work (sitemap) so the cookie store is
 * never read outside a request scope.
 */
export const jobsServer = {
  list(params: JobListParams = {}, init?: ServerFetchInit): Promise<JobsResponse> {
    return serverFetch<JobsResponse>(`jobs${toSearchString(jobListQuery(params))}`, init);
  },

  categories(init?: ServerFetchInit): Promise<JobCategoriesResponse> {
    return serverFetch<JobCategoriesResponse>('jobs/categories', init);
  },

  byId(id: string, init?: ServerFetchInit): Promise<AnyJob> {
    return serverFetch<AnyJob>(`jobs/${id}`, init);
  },

  async forUser(userId: string, init?: ServerFetchInit): Promise<AnyJob[]> {
    const data = await serverFetch<{ jobs: AnyJob[] }>(`jobs/user/${userId}`, init);
    return data?.jobs ?? [];
  },
};

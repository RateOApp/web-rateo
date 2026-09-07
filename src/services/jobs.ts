import { api } from '@/lib/api/client';
import { jobListQuery, type JobListParams } from '@/services/params';
import type {
  AnyJob,
  ApiMessage,
  Job,
  JobApplication,
  JobCategoriesResponse,
  JobsResponse,
} from '@/types/api';
import type { AppliedJobsResponse, SavedJobsResponse } from '@/types/dashboard';

export type { JobListParams } from '@/services/params';

/**
 * Browser-side jobs API (goes through the same-origin `/api` proxy).
 * The RSC equivalent lives in `@/services/jobs.server` as `jobsServer`.
 */
export const jobsService = {
  list(params: JobListParams = {}): Promise<JobsResponse> {
    return api.get<JobsResponse>('/jobs', { params: jobListQuery(params) }).then((r) => r.data);
  },

  /**
   * The personalised home feed. Deliberately sends NO `categories` param: the
   * backend then filters by the signed-in individual's `jobPreferences` and
   * echoes the industries it applied back in `categories`.
   */
  feed(): Promise<JobsResponse> {
    return api.get<JobsResponse>('/jobs').then((r) => r.data);
  },

  categories(): Promise<JobCategoriesResponse> {
    return api.get<JobCategoriesResponse>('/jobs/categories').then((r) => r.data);
  },

  byId(id: string): Promise<AnyJob> {
    return api.get<AnyJob>(`/jobs/${id}`).then((r) => r.data);
  },

  /** Recommendations for a user (max 50, no pagination). */
  forUser(userId: string): Promise<AnyJob[]> {
    return api.get<{ jobs: AnyJob[] }>(`/jobs/user/${userId}`).then((r) => r.data?.jobs ?? []);
  },

  /* ---- mutations / authenticated reads (client only) ------------------- */

  apply(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/jobs/${id}/apply`).then((r) => r.data);
  },

  withdraw(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/jobs/${id}/apply`).then((r) => r.data);
  },

  save(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/jobs/${id}/save`).then((r) => r.data);
  },

  unsave(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/jobs/${id}/save`).then((r) => r.data);
  },

  /** Saved jobs are always native jobs - imported listings cannot be saved. */
  saved(): Promise<Job[]> {
    return api.get<SavedJobsResponse>('/jobs/user/saved').then((r) => r.data?.savedJobs ?? []);
  },

  applied(): Promise<JobApplication[]> {
    return api
      .get<AppliedJobsResponse>('/jobs/user/applied')
      .then((r) => r.data?.applications ?? []);
  },

  /**
   * "Not interested" - the job is added to `user.blockedJobs` and disappears
   * from every list the server builds for this user.
   */
  block(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/users/jobs/${id}/block`).then((r) => r.data);
  },

  report(id: string, reason: string, details?: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/jobs/${id}/report`, { reason, details }).then((r) => r.data);
  },

  /** Imported (scraped) jobs have no company account; interest is the CTA. */
  expressInterest(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/imported-jobs/${id}/interest`).then((r) => r.data);
  },
};

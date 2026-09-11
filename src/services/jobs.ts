import { api } from '@/lib/api/client';
import { jobListQuery, type JobListParams } from '@/services/params';
import type {
  AnyJob,
  ApiMessage,
  InterestResponse,
  Job,
  JobApplication,
  JobCategoriesResponse,
  JobInterest,
  JobsResponse,
  MyInterestsResponse,
} from '@/types/api';
import type {
  ApplicantStatus,
  JobApplicantRow,
  JobPayload,
  MyJobsResponse,
} from '@/types/company-jobs';
import type { AppliedJobsResponse, SavedJobsResponse } from '@/types/dashboard';

/** `GET /jobs/company/myjobs` returns a bare array; some builds wrap it. */
function normaliseMyJobs(data: MyJobsResponse | null | undefined): Job[] {
  if (Array.isArray(data)) return data as Job[];
  const wrapped = data && typeof data === 'object' ? (data as { jobs?: unknown }).jobs : null;
  return Array.isArray(wrapped) ? (wrapped as Job[]) : [];
}

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
  expressInterest(id: string): Promise<InterestResponse> {
    return api.post<InterestResponse>(`/imported-jobs/${id}/interest`).then((r) => r.data);
  },

  /** Idempotent - withdrawing an interest that is not there still answers 200. */
  withdrawInterest(id: string): Promise<InterestResponse> {
    return api.delete<InterestResponse>(`/imported-jobs/${id}/interest`).then((r) => r.data);
  },

  /**
   * `GET /imported-jobs/interests/mine`. Individuals only - the server 403s
   * for companies.
   */
  myInterests(): Promise<JobInterest[]> {
    return api
      .get<MyInterestsResponse>('/imported-jobs/interests/mine')
      .then((r) => r.data?.interests ?? []);
  },

  /* ---- company-side (owner only) --------------------------------------- */

  /**
   * `POST /jobs`. Companies only; `category` must be a canonical industry and
   * the call 403s with `PARTICIPATION_OVERDUE` while a rating is outstanding.
   */
  create(payload: JobPayload): Promise<Job> {
    return api.post<Job>('/jobs', payload).then((r) => r.data);
  },

  /** `PUT /jobs/:id`. Partial - the controller keeps whatever it is not sent. */
  update(id: string, payload: Partial<JobPayload>): Promise<Job> {
    return api.put<Job>(`/jobs/${id}`, payload).then((r) => r.data);
  },

  remove(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/jobs/${id}`).then((r) => r.data);
  },

  /** Every job this company has posted, newest first. */
  myJobs(): Promise<Job[]> {
    return api
      .get<MyJobsResponse>('/jobs/company/myjobs')
      .then((r) => normaliseMyJobs(r.data));
  },

  applicants(id: string): Promise<JobApplicantRow[]> {
    return api
      .get<JobApplicantRow[]>(`/jobs/${id}/applicants`)
      .then((r) => (Array.isArray(r.data) ? r.data : []));
  },

  /**
   * `PUT /jobs/:id/applicants/:applicantId`. `applicantId` is the APPLICANT'S
   * USER ID, not the subdocument `_id`. Accepting converts the applicant into
   * an employee server-side, which is why it is participation-locked.
   */
  updateApplicantStatus(
    jobId: string,
    applicantId: string,
    status: ApplicantStatus,
  ): Promise<ApiMessage> {
    return api
      .put<ApiMessage>(`/jobs/${jobId}/applicants/${applicantId}`, { status })
      .then((r) => r.data);
  },
};

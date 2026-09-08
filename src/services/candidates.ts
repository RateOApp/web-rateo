import { api } from '@/lib/api/client';
import type { ApiMessage, Job, JobApplicantStatus, User, UsersResponse } from '@/types/api';
import type {
  CandidatePreferences,
  CompanyEmployeesResponse,
  UpdateCandidatePreferencesPayload,
  VerifyEmployeeAction,
} from '@/types/candidates';

/**
 * Browser-side company API for everything that is about PEOPLE: the candidate
 * feed, saved talents, blocks/reports, candidate preferences and the two
 * employee mutations the talent detail screen needs.
 *
 * `myJobs` lives here too so the candidates hub does not have to depend on the
 * jobs service landing first; both hit the same `GET /jobs/company/myjobs`.
 */
export const candidatesService = {
  /** `GET /users?role=individual&pageNumber=` - the paged candidate directory. */
  feed(pageNumber = 1): Promise<UsersResponse> {
    return api
      .get<UsersResponse>('/users', {
        params: { role: 'individual', pageNumber: String(pageNumber) },
      })
      .then((r) => r.data);
  },

  /** Same endpoint with a keyword; used by search and the suggestions dropdown. */
  search(keyword: string): Promise<UsersResponse> {
    return api
      .get<UsersResponse>('/users', {
        params: { role: 'individual', keyword: keyword.trim(), pageNumber: '1' },
      })
      .then((r) => r.data);
  },

  /** `GET /users/saved` - a BARE array of populated candidate documents. */
  saved(): Promise<User[]> {
    return api
      .get<User[] | { savedUsers?: User[] }>('/users/saved')
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.savedUsers ?? [])));
  },

  /** KYC-gated server-side: an unverified company gets a 403 mentioning KYC. */
  save(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/users/${encodeURIComponent(id)}/save`).then((r) => r.data);
  },

  unsave(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/users/${encodeURIComponent(id)}/save`).then((r) => r.data);
  },

  block(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/users/${encodeURIComponent(id)}/block`).then((r) => r.data);
  },

  report(id: string, reason: string, details?: string): Promise<ApiMessage> {
    return api
      .post<ApiMessage>(`/users/${encodeURIComponent(id)}/report`, { reason, details })
      .then((r) => r.data);
  },

  /* ---- candidate preferences ------------------------------------------- */

  preferences(): Promise<CandidatePreferences> {
    return api.get<CandidatePreferences>('/users/company/preferences').then((r) => r.data ?? {});
  },

  updatePreferences(
    payload: UpdateCandidatePreferencesPayload,
  ): Promise<CandidatePreferences> {
    return api
      .put<CandidatePreferences>('/users/company/preferences', payload)
      .then((r) => r.data ?? {});
  },

  /* ---- employees -------------------------------------------------------- */

  /** `GET /users/company/employees` -> `{ employees, requests }`. */
  employees(): Promise<CompanyEmployeesResponse> {
    return api
      .get<Partial<CompanyEmployeesResponse>>('/users/company/employees')
      .then((r) => ({
        employees: Array.isArray(r.data?.employees) ? r.data.employees : [],
        requests: Array.isArray(r.data?.requests) ? r.data.requests : [],
      }));
  },

  /** Approve or reject an employee's "I work here" claim. */
  verifyEmployee(id: string, action: VerifyEmployeeAction): Promise<ApiMessage> {
    return api
      .post<ApiMessage>(`/users/company/employees/${encodeURIComponent(id)}/verify`, { action })
      .then((r) => r.data);
  },

  /**
   * The real termination endpoint (3-day recovery window). NOT the mobile
   * `verify(reject)` shortcut, which only drops a pending claim.
   */
  terminateEmployee(id: string): Promise<ApiMessage> {
    return api
      .delete<ApiMessage>(`/users/company/employees/${encodeURIComponent(id)}`)
      .then((r) => r.data);
  },

  /* ---- job-side helpers the talent screens need ------------------------- */

  /** `PUT /jobs/:jobId/applicants/:applicantId { status }`. */
  updateApplicantStatus(
    jobId: string,
    applicantId: string,
    status: JobApplicantStatus,
  ): Promise<ApiMessage> {
    return api
      .put<ApiMessage>(
        `/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(applicantId)}`,
        { status },
      )
      .then((r) => r.data);
  },

  /** `GET /jobs/company/myjobs` - an array today, `{ jobs }` on older builds. */
  myJobs(): Promise<Job[]> {
    return api
      .get<Job[] | { jobs?: Job[] }>('/jobs/company/myjobs')
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.jobs ?? [])));
  },

  /** `DELETE /jobs/:id` - used by the "Manage applications" delete confirm. */
  deleteJob(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/jobs/${encodeURIComponent(id)}`).then((r) => r.data);
  },
};

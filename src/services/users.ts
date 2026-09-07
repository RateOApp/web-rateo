import { api } from '@/lib/api/client';
import type { AvatarUploadResponse, UpdateProfilePayload, User } from '@/types/api';
import type {
  ContactUpdateResponse,
  EditRequestPayload,
  EditRequestResponse,
  EmailChangeResponse,
  RequestCompanyResponse,
  ResumeResponse,
  UploadResponse,
  WorkHistoryItem,
} from '@/types/profile';

/**
 * Client-only user API. Uploads are multipart; the `/api` proxy streams the
 * body upstream, so `FormData` works unchanged. Do NOT set `Content-Type`
 * manually - the browser must add the multipart boundary.
 */

// The payload shape lives with the rest of the contract types.
export type { UpdateProfilePayload } from '@/types/api';

/** Axios does not narrow its errors, so read the status defensively. */
function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) return false;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 404;
}

export const usersService = {
  /**
   * The signed-in user. Uses `/auth/verify-token`, which returns the FULL user
   * document (`{ valid, user }`); `/auth/profile` omits `kycStatus`,
   * `experience`, `jobPreferences` and `savedJobs`, which the dashboard needs.
   */
  me(): Promise<User> {
    return api.get<{ valid: boolean; user: User }>('/auth/verify-token').then((r) => r.data.user);
  },

  byId(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`).then((r) => r.data);
  },

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return api.put<User>('/users/profile', payload).then((r) => r.data);
  },

  /**
   * `POST /users/avatar`, multipart field `image`. The controller replies with
   * the Cloudinary URL (`{ message, avatar }`), NOT the updated user.
   */
  uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const body = new FormData();
    body.append('image', file);
    return api.post<AvatarUploadResponse>('/users/avatar', body).then((r) => r.data);
  },

  uploadResume(userId: string, file: File): Promise<{ resume?: string; message?: string }> {
    const body = new FormData();
    body.append('resume', file);
    return api
      .post<{ resume?: string; message?: string }>(`/users/${userId}/resume`, body)
      .then((r) => r.data);
  },

  /**
   * `GET /users/:userId/work-history`. Returns the experience array projected
   * by the controller: `_id` renamed to `id`, `companyId` flattened out of the
   * populated document, and `noticeEffectiveDate` present only while a notice
   * is pending. Reasons and notes come back for the owner only.
   */
  workHistory(userId: string): Promise<WorkHistoryItem[]> {
    return api
      .get<WorkHistoryItem[] | { experience?: WorkHistoryItem[] }>(
        `/users/${encodeURIComponent(userId)}/work-history`,
      )
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.experience ?? [])));
  },

  /**
   * `GET /users/:userId/resume`. The controller answers 404 when the user has
   * never uploaded one, which is a normal state rather than a failure - so it
   * is folded into `{ resume: null }`.
   */
  resume(userId: string): Promise<ResumeResponse> {
    return api
      .get<{ resume?: string | null; resumePath?: string | null }>(
        `/users/${encodeURIComponent(userId)}/resume`,
      )
      .then((r) => ({ resume: r.data?.resume ?? r.data?.resumePath ?? null }))
      .catch((error: unknown) => {
        if (isNotFound(error)) return { resume: null };
        throw error;
      });
  },

  deleteResume(userId: string): Promise<{ message?: string }> {
    return api
      .delete<{ message?: string }>(`/users/${encodeURIComponent(userId)}/resume`)
      .then((r) => r.data);
  },

  /** `POST /upload`, multipart field `file` -> `{ url }` (Cloudinary). */
  uploadFile(file: File): Promise<UploadResponse> {
    const body = new FormData();
    body.append('file', file);
    return api.post<UploadResponse>('/upload', body).then((r) => r.data);
  },

  /* ---- self-service email change (OTP wizard) -------------------------- */
  // start -> verify-old -> send-new -> verify-new. Each step emails a 6-digit
  // code; the server enforces its own resend cooldowns (429).

  startEmailChange(): Promise<EmailChangeResponse> {
    return api.post<EmailChangeResponse>('/users/email/change/start').then((r) => r.data);
  },

  verifyOldEmailOtp(code: string): Promise<EmailChangeResponse> {
    return api
      .post<EmailChangeResponse>('/users/email/change/verify-old', { code })
      .then((r) => r.data);
  },

  sendNewEmailOtp(newEmail: string): Promise<EmailChangeResponse> {
    return api
      .post<EmailChangeResponse>('/users/email/change/send-new', { newEmail })
      .then((r) => r.data);
  },

  /** On success the address has already switched; the body carries the new one. */
  verifyNewEmailOtp(code: string): Promise<EmailChangeResponse> {
    return api
      .post<EmailChangeResponse>('/users/email/change/verify-new', { code })
      .then((r) => r.data);
  },

  /* ---- admin-gated email / phone edits --------------------------------- */
  // Both requests need an 11-digit NIN AND an already-hosted selfie URL; the
  // backend rejects anything else.

  requestEmailEdit(payload: EditRequestPayload): Promise<EditRequestResponse> {
    return api.patch<EditRequestResponse>('/users/email/request', payload).then((r) => r.data);
  },

  updateEmail(email: string): Promise<ContactUpdateResponse> {
    return api.patch<ContactUpdateResponse>('/users/email', { email }).then((r) => r.data);
  },

  requestPhoneEdit(payload: EditRequestPayload): Promise<EditRequestResponse> {
    return api.patch<EditRequestResponse>('/users/phone/request', payload).then((r) => r.data);
  },

  updatePhone(phone: string): Promise<ContactUpdateResponse> {
    return api.patch<ContactUpdateResponse>('/users/phone', { phone }).then((r) => r.data);
  },

  /** `POST /users/request-company` - the company confirms the employment. */
  requestToJoinCompany(companyId: string): Promise<RequestCompanyResponse> {
    return api
      .post<RequestCompanyResponse>('/users/request-company', { companyId })
      .then((r) => r.data);
  },

  /**
   * `DELETE /users/:id` - deactivates now and schedules a permanent delete in
   * 14 days. Logging back in before then cancels it.
   */
  deleteAccount(userId: string): Promise<{ message?: string }> {
    return api.delete<{ message?: string }>(`/users/${userId}`).then((r) => r.data);
  },

  search(query: string): Promise<User[]> {
    return api
      .post<User[] | { users: User[] }>('/users/search', { query })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.users ?? [])));
  },

  searchCompanies(query: string): Promise<User[]> {
    return api
      .post<User[] | { users: User[] }>('/users/search-companies', { query })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.users ?? [])));
  },
};

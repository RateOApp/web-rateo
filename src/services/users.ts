import { api } from '@/lib/api/client';
import type { User } from '@/types/api';

/**
 * Client-only user API. Uploads are multipart; the `/api` proxy streams the
 * body upstream, so `FormData` works unchanged. Do NOT set `Content-Type`
 * manually - the browser must add the multipart boundary.
 */

export type UpdateProfilePayload = Partial<
  Pick<
    User,
    | 'firstName'
    | 'lastName'
    | 'gender'
    | 'bio'
    | 'location'
    | 'phone'
    | 'skills'
    | 'experience'
    | 'education'
    | 'jobPreferences'
    | 'jobTitle'
    | 'companyName'
    | 'industry'
    | 'companySize'
    | 'website'
    | 'description'
    | 'avatar'
  >
>;

export const usersService = {
  /** The signed-in user. Note: `/auth/profile` does NOT include `kycStatus`. */
  me(): Promise<User> {
    return api.get<User>('/auth/profile').then((r) => r.data);
  },

  byId(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`).then((r) => r.data);
  },

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return api.put<User>('/users/profile', payload).then((r) => r.data);
  },

  uploadAvatar(file: File): Promise<User> {
    const body = new FormData();
    body.append('image', file);
    return api.post<User>('/users/avatar', body).then((r) => r.data);
  },

  uploadResume(userId: string, file: File): Promise<{ resume?: string; message?: string }> {
    const body = new FormData();
    body.append('resume', file);
    return api
      .post<{ resume?: string; message?: string }>(`/users/${userId}/resume`, body)
      .then((r) => r.data);
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

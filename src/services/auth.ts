import { api } from '@/lib/api/client';
import type { ApiMessage, ClientAuthResponse, Role, User } from '@/types/api';

/**
 * Client-only auth API.
 *
 * Every token-issuing call goes through the `/api` proxy, which strips `token`
 * from the response body and stores it in the httpOnly `rateo_token` cookie.
 * Nothing here ever sees or stores a JWT.
 */

export type LoginPayload = { email: string; password: string };

export type RegisterIndividualPayload = {
  role: 'individual';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
};

export type RegisterCompanyPayload = {
  role: 'company';
  email: string;
  password: string;
  companyName: string;
  industry: string;
  description?: string;
  phone?: string;
  location?: string;
};

export type RegisterPayload = RegisterIndividualPayload | RegisterCompanyPayload;

/** Built from a Clerk profile. `role` only matters when creating the account. */
export type SocialLoginPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: Role;
};

export const authService = {
  login(payload: LoginPayload): Promise<ClientAuthResponse> {
    return api.post<ClientAuthResponse>('/auth/login', payload).then((r) => r.data);
  },

  register(payload: RegisterPayload): Promise<ClientAuthResponse> {
    return api.post<ClientAuthResponse>('/auth/register', payload).then((r) => r.data);
  },

  socialLogin(payload: SocialLoginPayload): Promise<ClientAuthResponse> {
    return api.post<ClientAuthResponse>('/auth/social-login', payload).then((r) => r.data);
  },

  /** 5-digit code emailed on register. Requires the session cookie. */
  verifyEmail(code: string): Promise<ClientAuthResponse> {
    return api.post<ClientAuthResponse>('/auth/verify-email', { code }).then((r) => r.data);
  },

  resendVerification(): Promise<ApiMessage> {
    return api.post<ApiMessage>('/auth/resend-verification').then((r) => r.data);
  },

  forgotPassword(email: string): Promise<ApiMessage> {
    return api.post<ApiMessage>('/auth/forgot-password', { email }).then((r) => r.data);
  },

  verifyResetCode(email: string, code: string): Promise<ApiMessage> {
    return api.post<ApiMessage>('/auth/verify-reset-code', { email, code }).then((r) => r.data);
  },

  resetPassword(email: string, code: string, newPassword: string): Promise<ApiMessage> {
    return api
      .post<ApiMessage>('/auth/reset-password', { email, code, newPassword })
      .then((r) => r.data);
  },

  changePassword(currentPassword: string, newPassword: string): Promise<ApiMessage> {
    return api
      .post<ApiMessage>('/auth/change-password', { currentPassword, newPassword })
      .then((r) => r.data);
  },

  profile(): Promise<User> {
    return api.get<User>('/auth/profile').then((r) => r.data);
  },

  /**
   * Local route handler that expires the cookies - NOT a backend call, so it
   * deliberately bypasses the axios instance (whose 401 interceptor would
   * otherwise be able to re-enter this).
   */
  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },
};

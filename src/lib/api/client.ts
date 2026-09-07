'use client';

import axios, { type AxiosError } from 'axios';

import { getApiErrorMessage } from '@/lib/api/errors';

export { getApiErrorMessage };
export { ApiError } from '@/lib/api/errors';

/**
 * Browser axios instance. `baseURL` is the SAME-ORIGIN proxy at `/api`, which
 * forwards to `API_BASE_URL` server-side and injects the bearer token from the
 * httpOnly cookie. The backend origin is never known to the browser.
 */
export const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

/**
 * Auth endpoints legitimately answer 401 for bad credentials / bad codes.
 * A 401 from these must NOT be treated as an expired session.
 */
const AUTH_ENDPOINTS =
  /\/auth\/(login|register|social-login|google|forgot-password|reset-password|verify-reset-code)/;

/** Guards against a burst of parallel 401s each firing a logout. */
let sessionExpiredHandled = false;

function requestPath(error: AxiosError): string {
  const raw = error.config?.url ?? '';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

api.interceptors.response.use(
  (response) => {
    sessionExpiredHandled = false;
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.test(requestPath(error))) {
      if (!sessionExpiredHandled) {
        sessionExpiredHandled = true;

        // Clear the httpOnly cookies; we cannot touch them from JS.
        void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

        if (typeof window !== 'undefined') {
          const { pathname, search } = window.location;
          if (pathname.startsWith('/dashboard') || pathname.startsWith('/setup')) {
            // A hard navigation is deliberate here: the session is gone, and a
            // full document load is the only way to drop every cached RSC
            // payload and in-memory query result for the signed-out user.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign(`/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

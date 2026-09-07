import 'server-only';

import { cookies } from 'next/headers';

import { ApiError, messageFromBody } from '@/lib/api/errors';
import { getApiBaseUrl, getAppUrl } from '@/lib/env';
import { COOKIE_TOKEN } from '@/lib/session';
import type { User } from '@/types/api';

export type ServerFetchInit = RequestInit & {
  /** Set `false` to skip the `Authorization` header even when a token exists. */
  auth?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Server-side fetch against the Rate O backend.
 *
 * - `path` is relative to `API_BASE_URL` (leading slash optional).
 * - Sends `Authorization: Bearer <rateo_token>` unless `auth: false`.
 * - Defaults to `cache: 'no-store'`; pass `next` or `cache` to opt into the
 *   Next data cache for public, cacheable reads.
 * - Throws `ApiError` on any non-2xx.
 */
export async function serverFetch<T>(path: string, init: ServerFetchInit = {}): Promise<T> {
  const { auth, headers, ...rest } = init;

  const url = `${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('accept')) requestHeaders.set('accept', 'application/json');

  if (auth !== false) {
    const token = (await cookies()).get(COOKIE_TOKEN)?.value;
    if (token) requestHeaders.set('authorization', `Bearer ${token}`);
  }

  const hasCachingHint = rest.cache !== undefined || rest.next !== undefined;

  const res = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    ...(hasCachingHint ? {} : { cache: 'no-store' as const }),
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      messageFromBody(body) ?? `Request to ${path} failed with status ${res.status}`;
    const code = isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
    throw new ApiError(message, res.status, body, code);
  }

  return body as T;
}

/**
 * The signed-in user, from the session cookie.
 *
 * Returns `null` when there is no cookie, and also when the backend rejects the
 * token (401) or the account is suspended / gated (403) - callers render the
 * signed-out branch instead of an error page. Anything else is rethrown.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  if (!token) return null;

  try {
    return await serverFetch<User>('auth/profile');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}

/** Absolute URL on this app's own origin, for metadata / sitemap / redirects. */
export function absoluteUrl(path = ''): string {
  const base = getAppUrl();
  const suffix = path.replace(/^\/+/, '');
  return suffix ? `${base}/${suffix}` : base;
}

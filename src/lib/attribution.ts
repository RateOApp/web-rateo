/**
 * Scaloo / Singular attribution (`sl_cid`) capture.
 *
 * A landing URL like `/?sl_cid=abc12345` sets the httpOnly `rateo_scaloo_ref`
 * cookie in `proxy.ts` (last touch wins). The `/api` proxy then adds it as
 * `scalooRef` to `POST auth/register`, and `/api/auth/social-login` adds it to
 * the upstream social-login payload. The backend owns everything after that.
 *
 * Must stay free of `next/headers`: `proxy.ts` imports it.
 */

export const SCALOO_COOKIE = 'rateo_scaloo_ref';

/** Query params that carry the ref, in priority order. */
export const SCALOO_PARAMS = ['sl_cid', 'sc_ref'] as const;

/** 30 days, in seconds. */
export const SCALOO_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const SCALOO_REF_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidScalooRef(v: unknown): v is string {
  return typeof v === 'string' && SCALOO_REF_PATTERN.test(v);
}

export function scalooCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SCALOO_COOKIE_MAX_AGE,
  };
}

/** First valid ref among `SCALOO_PARAMS`, or null. */
export function readScalooRefFromSearchParams(sp: URLSearchParams): string | null {
  for (const name of SCALOO_PARAMS) {
    const value = sp.get(name);
    if (isValidScalooRef(value)) return value;
  }
  return null;
}

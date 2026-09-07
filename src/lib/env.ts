/**
 * Typed access to the handful of environment variables this app reads.
 *
 * `API_BASE_URL` is deliberately NOT prefixed with `NEXT_PUBLIC_`: the browser
 * must never learn the backend origin. Client code always calls the
 * same-origin `/api/*` proxy instead.
 */

/**
 * Backend REST base, e.g. `https://api-prod.rateo.ng/api`.
 * Server-only. Throws when unset so misconfiguration fails loudly instead of
 * silently producing `undefined/jobs` requests.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.API_BASE_URL;
  if (!raw || !raw.trim()) {
    throw new Error(
      'API_BASE_URL is not set. Add it to .env.local (local) or the Vercel project env (deployed). It is server-only — do not prefix it with NEXT_PUBLIC_.',
    );
  }
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Public origin this app is served from, without a trailing slash.
 * Falls back to `http://localhost:3000` so dev works with no env file.
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw || !raw.trim()) return 'http://localhost:3000';
  return raw.trim().replace(/\/+$/, '');
}

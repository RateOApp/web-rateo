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
 * Socket.IO origin, e.g. `https://api-prod.rateo.ng` (no `/api` suffix -
 * Socket.IO is mounted at the server root, on the default `/socket.io/` path).
 *
 * Server-only, exactly like `API_BASE_URL`: it is read by the
 * `GET /api/auth/socket` route handler, which hands the URL to the browser
 * together with a short-lived ticket. Do NOT prefix it with `NEXT_PUBLIC_`.
 *
 * Defaults to `API_BASE_URL` with the trailing `/api` removed, which is right
 * for every current deployment; set `SOCKET_URL` only when the realtime server
 * lives somewhere else.
 */
export function getSocketUrl(): string {
  const raw = process.env.SOCKET_URL;
  if (raw && raw.trim()) return raw.trim().replace(/\/+$/, '');
  return getApiBaseUrl().replace(/\/api\/?$/, '');
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

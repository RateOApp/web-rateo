import { NextResponse, type NextRequest } from 'next/server';

import { getApiBaseUrl } from '@/lib/env';
import { COOKIE_ROLE, COOKIE_TOKEN, isRole, setSessionCookies, type Role } from '@/lib/session';

/**
 * Same-origin REST proxy.
 *
 * The browser only ever talks to `/api/*`. This forwards to
 * `${API_BASE_URL}/*` server-side, attaches the bearer token from the httpOnly
 * cookie, and - on the auth paths that mint a JWT - moves `token` out of the
 * response body and into the cookie so it never reaches JavaScript.
 */

/** The only request headers we pass upstream. `cookie` is never forwarded. */
const FORWARDED_REQUEST_HEADERS = [
  'content-type',
  'accept',
  'content-length',
  'accept-language',
  'x-requested-with',
] as const;

/** The only upstream response headers we pass back. Drops `set-cookie`. */
const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'etag',
  'location',
] as const;

/** Paths whose 2xx body carries a fresh JWT. See docs/API_CONTRACT.md. */
const TOKEN_ISSUING_PATHS = new Set([
  'auth/login',
  'auth/register',
  'auth/social-login',
  'auth/google',
  'auth/verify-email',
  'auth/refresh-token',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function proxyRequest(
  req: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  const segments = pathSegments ?? [];

  // No traversal out of the API base.
  if (segments.some((segment) => segment.includes('..'))) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  const path = segments.join('/');

  let target: string;
  try {
    target = `${getApiBaseUrl()}/${path}${req.nextUrl.search}`;
  } catch {
    return NextResponse.json({ message: 'API base URL is not configured' }, { status: 500 });
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has('accept')) headers.set('accept', 'application/json');

  const token = req.cookies.get(COOKIE_TOKEN)?.value;
  if (token) headers.set('authorization', `Bearer ${token}`);

  const forwardedFor =
    req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  const method = req.method.toUpperCase();
  const sendsBody = method !== 'GET' && method !== 'HEAD';

  // `duplex: 'half'` is required to stream a request body (multipart uploads);
  // it is not yet in the DOM `RequestInit` type.
  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  };
  if (sendsBody) {
    init.body = req.body;
    init.duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    // DNS/TLS/socket failure reaching the backend. Log it - this is the only
    // place the real cause is visible - and give the client a clean 502.
    console.error(`[api-proxy] ${method} ${path} failed`, err);
    return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 });
  }

  const status = upstream.status >= 200 ? upstream.status : 502;
  const isSuccess = status >= 200 && status < 300;

  // --- Token capture -------------------------------------------------------
  if (isSuccess && TOKEN_ISSUING_PATHS.has(path)) {
    const contentType = upstream.headers.get('content-type') ?? '';
    if (contentType.includes('json')) {
      const text = await upstream.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }

      if (isRecord(parsed) && typeof parsed.token === 'string' && parsed.token) {
        const issuedToken = parsed.token;

        const body: Record<string, unknown> = { ...parsed };
        delete body.token;

        const existingRole = req.cookies.get(COOKIE_ROLE)?.value;
        let role: Role | null = null;
        if (isRole(parsed.role)) role = parsed.role;
        else if (isRole(existingRole)) role = existingRole;

        const res = NextResponse.json(body, { status });
        return setSessionCookies(res, { token: issuedToken, role });
      }

      // 2xx JSON with no token - hand the untouched body back.
      return new Response(text, { status, headers: buildResponseHeaders(upstream) });
    }
  }

  // --- Pass-through --------------------------------------------------------
  const bodilessStatus = status === 204 || status === 205 || status === 304;
  return new Response(bodilessStatus ? null : upstream.body, {
    status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
}

import { NextResponse, type NextRequest } from 'next/server';

import { getApiBaseUrl, getAppUrl } from '@/lib/env';
import {
  COOKIE_IMPERSONATION,
  isRole,
  sessionCookieOptions,
  setSessionCookies,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_AGE = 1800;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Public origin to redirect back to. Behind the production reverse proxy
 * `req.url` carries the internal origin (localhost:3001), so an absolute
 * redirect built from it sends the admin's browser to localhost. Prefer the
 * forwarded host, then NEXT_PUBLIC_APP_URL, and only then the request origin.
 */
function publicOrigin(req: NextRequest): string {
  const fwdHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const fwdProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (fwdHost && !LOCAL_HOST.test(fwdHost)) return `${fwdProto}://${fwdHost}`;
  const configured = getAppUrl();
  if (!LOCAL_HOST.test(new URL(configured).host)) return configured;
  const host = req.headers.get('host');
  if (host && !LOCAL_HOST.test(host)) return `${fwdProto}://${host}`;
  return new URL(req.url).origin;
}

function redirectTo(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, publicOrigin(req)), 303);
}

function fail(req: NextRequest): Response {
  return redirectTo(req, '/impersonate/expired');
}

/** Admin support entry: exchanges a one-time code for a short-lived session. */
export async function GET(req: NextRequest): Promise<Response> {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return fail(req);

  let body: unknown;
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/auth/impersonate/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });
    if (!upstream.ok) return fail(req);
    body = await upstream.json();
  } catch {
    return fail(req);
  }

  if (!isRecord(body) || typeof body.token !== 'string' || !body.token) return fail(req);

  const expiresAt = typeof body.expiresAt === 'string' ? body.expiresAt : '';
  const secs = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000);
  if (!Number.isFinite(secs) || secs <= 0) return fail(req);
  const maxAge = Math.min(MAX_AGE, secs);

  const user = isRecord(body.user) ? body.user : {};
  const imp = isRecord(body.impersonation) ? body.impersonation : {};
  const role = isRole(body.role) ? body.role : isRole(user.role) ? user.role : null;
  const userName =
    (typeof user.companyName === 'string' && user.companyName.trim()) ||
    [user.firstName, user.lastName].filter((x) => typeof x === 'string' && x).join(' ') ||
    (typeof user.email === 'string' ? user.email : 'user');

  const res = redirectTo(req, '/dashboard');
  setSessionCookies(res, { token: body.token, role, maxAge });
  res.cookies.set(
    COOKIE_IMPERSONATION,
    JSON.stringify({
      adminName: typeof imp.adminName === 'string' ? imp.adminName : 'Admin',
      userName,
      expiresAt,
    }),
    { ...sessionCookieOptions(), maxAge },
  );
  return res;
}

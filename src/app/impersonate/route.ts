import { NextResponse, type NextRequest } from 'next/server';

import { getApiBaseUrl } from '@/lib/env';
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

function fail(req: NextRequest): Response {
  return NextResponse.redirect(new URL('/impersonate/expired', req.url), 303);
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

  const res = NextResponse.redirect(new URL('/dashboard', req.url), 303);
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

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

/** httpOnly cookie holding the backend JWT. */
export const COOKIE_TOKEN = 'rateo_token';
/** httpOnly cookie holding the account role, used for route/layout branching. */
export const COOKIE_ROLE = 'rateo_role';

/** httpOnly cookie marking an admin support (impersonation) session. JSON payload. */
export const COOKIE_IMPERSONATION = 'rateo_imp';

export type Role = 'individual' | 'company';

export type Session = { token: string; role: Role | null };

/** Backend JWTs are issued with a 30-day expiry; match it on the cookie. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function isRole(v: unknown): v is Role {
  return v === 'individual' || v === 'company';
}

/**
 * Reads the session from cookies. Returns `null` when there is no token.
 * Presence only — the JWT is never verified here, the backend does that.
 */
export async function getServerSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_TOKEN)?.value;
  if (!token) return null;
  const role = store.get(COOKIE_ROLE)?.value;
  return { token, role: isRole(role) ? role : null };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/** Sets the token cookie (and the role cookie when a role is supplied). */
export function setSessionCookies(
  res: NextResponse,
  s: { token: string; role?: Role | null; maxAge?: number },
): NextResponse {
  const options = {
    ...sessionCookieOptions(),
    ...(s.maxAge !== undefined ? { maxAge: s.maxAge } : {}),
  };
  res.cookies.set(COOKIE_TOKEN, s.token, options);
  if (s.role) res.cookies.set(COOKIE_ROLE, s.role, options);
  return res;
}

/** Expires both session cookies. */
export function clearSessionCookies(res: NextResponse): NextResponse {
  const options = { ...sessionCookieOptions(), maxAge: 0 };
  res.cookies.set(COOKIE_TOKEN, '', options);
  res.cookies.set(COOKIE_ROLE, '', options);
  res.cookies.set(COOKIE_IMPERSONATION, '', options);
  return res;
}

export type Impersonation = { adminName: string; userName: string; expiresAt: string };

/** Reads the support-session marker cookie. `null` when absent or malformed. */
export async function getImpersonation(): Promise<Impersonation | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_IMPERSONATION)?.value;
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return null;
    const r = v as Record<string, unknown>;
    if (
      typeof r.adminName !== 'string' ||
      typeof r.userName !== 'string' ||
      typeof r.expiresAt !== 'string'
    ) {
      return null;
    }
    return { adminName: r.adminName, userName: r.userName, expiresAt: r.expiresAt };
  } catch {
    return null;
  }
}

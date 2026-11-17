import { NextResponse } from 'next/server';

import { clearSessionCookies } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Ends the session by expiring both cookies. Static route files take priority
 * over the `[...path]` catch-all, so this never reaches the backend - which is
 * what we want, the backend JWT is stateless and has nothing to revoke.
 */
export async function POST(): Promise<Response> {
  return clearSessionCookies(NextResponse.json({ ok: true }));
}

/**
 * Server-side escape hatch for a dead session cookie (expired token, or a
 * suspended/banned account). The dashboard layout can't clear cookies from a
 * server component, and redirecting straight to /login would bounce back
 * (proxy.ts sends cookie holders away from /login). Clear first, then land on
 * a FIXED page — never a caller-supplied URL (no open redirect).
 */
export async function GET(req: Request): Promise<Response> {
  const reason = new URL(req.url).searchParams.get('reason');
  const target = reason === 'restricted' ? '/account-restricted' : '/login';
  return clearSessionCookies(NextResponse.redirect(new URL(target, req.url)));
}

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

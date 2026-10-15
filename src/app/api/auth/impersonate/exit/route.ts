import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/env';
import { clearSessionCookies, COOKIE_TOKEN } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Ends an admin support session: tells the backend (best effort), clears cookies. */
export async function POST(): Promise<Response> {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  if (token) {
    try {
      await fetch(`${getApiBaseUrl()}/auth/impersonate/end`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
        cache: 'no-store',
      });
    } catch {
      // Ignored: the token expires on its own.
    }
  }
  return clearSessionCookies(NextResponse.json({ ok: true }));
}

import { NextResponse } from 'next/server';

import { getServerSession } from '@/lib/session';
import type { SessionResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * Cheap "am I signed in?" probe for client code. Cookie presence only - no
 * upstream call, no JWT verification. Use `GET /api/auth/profile` when the
 * actual user document is needed.
 */
export async function GET(): Promise<Response> {
  const session = await getServerSession();
  const body: SessionResponse = {
    authenticated: session !== null,
    role: session?.role ?? null,
  };
  return NextResponse.json(body);
}

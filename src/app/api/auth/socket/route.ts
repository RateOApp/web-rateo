import { NextResponse } from 'next/server';

import { getApiBaseUrl, getSocketUrl } from '@/lib/env';
import { getServerSession } from '@/lib/session';
import type { SocketSession } from '@/types/socket';

export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Hands the browser everything it needs to open the realtime connection:
 * the socket origin (server-only env) and a short-lived, socket-scoped ticket
 * minted by the backend. The 30-day session JWT never reaches JavaScript, so
 * it can never be used as a socket credential either.
 *
 * Production has not deployed `POST /auth/socket-ticket` yet. A 404/405 from
 * upstream therefore answers `{ url, ticket: null }` and the client connects in
 * legacy mode (unauthenticated handshake, joining `user_<id>` itself). The
 * moment the endpoint ships, the same call starts returning a ticket and the
 * client upgrades with no further change here.
 */
export async function GET(): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
  }

  let url: string;
  try {
    url = getSocketUrl();
  } catch {
    return NextResponse.json({ message: 'Socket URL is not configured' }, { status: 500 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/auth/socket-ticket`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.token}`,
        accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[socket-ticket] upstream request failed', error);
    return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 });
  }

  // Endpoint not deployed (404) or the route exists for other verbs only (405).
  if (upstream.status === 404 || upstream.status === 405) {
    const legacy: SocketSession = { url, ticket: null };
    return NextResponse.json(legacy);
  }

  if (!upstream.ok) {
    return NextResponse.json({ message: 'Could not issue a socket ticket' }, { status: 502 });
  }

  let body: unknown;
  try {
    body = await upstream.json();
  } catch {
    body = undefined;
  }

  const ticket = isRecord(body) && typeof body.ticket === 'string' ? body.ticket : null;
  const expiresIn = isRecord(body) && typeof body.expiresIn === 'number' ? body.expiresIn : undefined;

  const payload: SocketSession = { url, ticket, ...(expiresIn ? { expiresIn } : {}) };
  return NextResponse.json(payload);
}

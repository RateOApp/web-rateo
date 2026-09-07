import { currentUser } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { messageFromBody } from '@/lib/api/errors';
import { clerkServerEnabled } from '@/lib/clerk';
import { extractClerkName } from '@/lib/clerk-name';
import { getApiBaseUrl } from '@/lib/env';
import { isRole, setSessionCookies, type Role } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Clerk -> Rate'O session exchange.
 *
 * The email NEVER comes from the request body: it is read server-side from the
 * Clerk session with `currentUser()`. The client may only say which kind of
 * account to create if this is a first sign-in (`role`, `companyName`), which
 * the backend ignores for an existing user.
 *
 * This is a dedicated handler, not the `/api/[...path]` proxy: it has to call
 * the backend itself after reading the Clerk user. Static route files take
 * priority over the catch-all, so `/api/auth/social-login` lands here.
 */

const bodySchema = z.object({
  role: z.enum(['individual', 'company']).optional(),
  companyName: z.string().trim().min(1).max(200).optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!clerkServerEnabled()) {
    return NextResponse.json({ message: 'Social login is not configured' }, { status: 503 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { message: 'Not signed in with a social provider' },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  // Unknown keys are dropped rather than rejected - the client is ours, but
  // nothing beyond role/companyName may ever reach the backend.
  const parsed = bodySchema.safeParse(isRecord(raw) ? raw : {});
  const { role, companyName } = parsed.success ? parsed.data : {};

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json(
      { message: 'Your social account has no email address' },
      { status: 400 },
    );
  }

  const { firstName, lastName } = extractClerkName(user);

  const payload = {
    email,
    firstName,
    lastName,
    avatar: user.imageUrl ?? '',
    ...(role ? { role } : {}),
    ...(role === 'company' && companyName ? { companyName } : {}),
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/auth/social-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[social-login] upstream request failed', err);
    return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 });
  }

  const text = await upstream.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: messageFromBody(body) ?? 'Social login failed' },
      { status: upstream.status },
    );
  }

  if (!isRecord(body) || typeof body.token !== 'string' || !body.token) {
    return NextResponse.json({ message: 'Social login failed' }, { status: 502 });
  }

  const token = body.token;
  const rest: Record<string, unknown> = { ...body };
  delete rest.token;

  const nextRole: Role | null = isRole(body.role) ? body.role : (role ?? null);

  const res = NextResponse.json(rest, { status: upstream.status });
  return setSessionCookies(res, { token, role: nextRole });
}

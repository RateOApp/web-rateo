import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { clerkServerEnabled } from '@/lib/clerk';

/**
 * Next 16 replaced `middleware.ts` with `proxy.ts`.
 *
 * Cookie presence only - the JWT is never decoded or verified here. The
 * backend is the authority; the dashboard layout fetches `/auth/profile`
 * server-side and handles a real 401 there.
 *
 * Cookie names are duplicated from `src/lib/session.ts` rather than imported,
 * because that module pulls in `next/headers`.
 *
 * When both Clerk keys are set the guard runs INSIDE `clerkMiddleware()`, so
 * `/sso-callback` gets Clerk's handshake handling and `currentUser()` works in
 * `/api/auth/social-login`. With the keys empty the plain guard runs on its
 * own and no Clerk code executes at all.
 */

const COOKIE_TOKEN = 'rateo_token';

/** Signed-in-only areas. */
const PROTECTED_PREFIXES = ['/dashboard', '/setup'];

/**
 * Pages that make no sense while signed in.
 * `/verify` is deliberately absent: it is reached WITH a token, right after
 * register, to submit the emailed 5-digit code. `/reset-password` and
 * `/sso-callback` are absent for the same reason - both can legitimately be
 * open while a cookie exists.
 */
const AUTH_ONLY_PAGES = ['/login', '/register', '/register/company', '/forgot-password'];

/**
 * Paths the guard never touches. The Clerk matcher below is wider than the
 * Phase-1 one (it has to cover `/api/auth/social-login` and `/sso-callback`),
 * so the redirect rules opt out of everything that is not a page.
 */
function isIgnored(pathname: string): boolean {
  return (
    pathname.startsWith('/api/') ||
    pathname === '/api' ||
    pathname.startsWith('/.well-known/') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

function guard(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;

  if (isIgnored(pathname)) return NextResponse.next();

  const hasToken = Boolean(req.cookies.get(COOKIE_TOKEN)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasToken && AUTH_ONLY_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

const handler = clerkServerEnabled()
  ? clerkMiddleware(async (_auth, req) => guard(req))
  : guard;

export default handler;

export const config = {
  // Clerk's recommended matcher: everything except Next internals and static
  // files, plus every API route.
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

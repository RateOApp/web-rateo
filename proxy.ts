import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next 16 replaced `middleware.ts` with `proxy.ts`.
 *
 * Cookie presence only - the JWT is never decoded or verified here. The
 * backend is the authority; the dashboard layout fetches `/auth/profile`
 * server-side and handles a real 401 there.
 *
 * Kept dependency-free on purpose (edge runtime, runs on every navigation).
 * Cookie names are duplicated from `src/lib/session.ts` rather than imported,
 * because that module pulls in `next/headers`.
 */

const COOKIE_TOKEN = 'rateo_token';

/** Signed-in-only areas. */
const PROTECTED_PREFIXES = ['/dashboard', '/setup'];

/**
 * Pages that make no sense while signed in.
 * `/verify` is deliberately absent: it is reached WITH a token, right after
 * register, to submit the emailed 5-digit code.
 */
const AUTH_ONLY_PAGES = ['/login', '/register', '/register/company', '/forgot-password'];

// Phase 3: wrap this handler in `clerkMiddleware()` from '@clerk/nextjs/server'.
export function proxy(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;
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

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|\\.well-known|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|json)$).*)',
  ],
};

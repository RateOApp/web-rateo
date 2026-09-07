/**
 * Clerk is OPTIONAL at runtime.
 *
 * Social sign-in (Google / Apple / LinkedIn) shares the mobile app's Clerk
 * instance, but the whole app - build included - must work with the keys
 * unset. Everything Clerk-related is therefore behind these two flags:
 *
 * - `clerkEnabled` (client-safe): the publishable key is present, so
 *   `<ClerkProvider>` is mounted and the social buttons render.
 * - `clerkServerEnabled()` (server-only): both keys are present, so the
 *   middleware can run `clerkMiddleware()` and `/api/auth/social-login` can
 *   read the Clerk user with `currentUser()`.
 *
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is inlined into the browser bundle by
 * Next at build time; `CLERK_SECRET_KEY` is only ever read on the server.
 */

/** Clerk publishable key, or `''` when Clerk is not configured. */
export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/** True when the browser half of Clerk can be mounted. */
export const clerkEnabled = clerkPublishableKey.length > 0;

/**
 * True when BOTH Clerk keys are set. Call this from server code only - it
 * reads `CLERK_SECRET_KEY`, which must never reach the client bundle.
 */
export function clerkServerEnabled(): boolean {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  return Boolean(publishable && secret);
}

/**
 * Readable text for a `ClerkError` (the `{ error }` returned by every
 * `signIn.*` / `signUp.*` call). `longMessage` is the user-facing one;
 * `message` is aimed at developers but beats showing nothing.
 * Structural on purpose, so no Clerk type has to be imported here.
 */
export function clerkErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { longMessage?: unknown; message?: unknown };
    if (typeof candidate.longMessage === 'string' && candidate.longMessage.trim()) {
      return candidate.longMessage.trim();
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message.trim();
    }
  }
  return fallback;
}

/** Key for the `sessionStorage` blob that survives the OAuth round-trip. */
export const SSO_STORAGE_KEY = 'rateo.sso';

/** What the social buttons stash before leaving for the provider. */
export type SsoIntent = {
  role?: 'individual' | 'company';
  companyName?: string;
  next?: string;
};

/**
 * `next` is only honoured when it is a path on this origin: a single leading
 * slash, never `//evil.com` (protocol-relative) and never an absolute URL.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

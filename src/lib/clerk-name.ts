import type { User } from '@clerk/nextjs/server';

/**
 * Ported from `app-rateo/src/utils/clerkName.js`.
 *
 * Apple only shares the user's name on the very first authorization, so
 * Clerk's top-level `firstName` / `lastName` are often empty. Fall back to the
 * full name, then to whatever the external account (Google / Apple / LinkedIn)
 * captured, before giving up.
 */
export function extractClerkName(user: User): { firstName: string; lastName: string } {
  const ext = user.externalAccounts?.[0];
  const full = (user.fullName ?? '').trim();
  const fullParts = full ? full.split(/\s+/) : [];

  const firstName = user.firstName || fullParts[0] || ext?.firstName || '';
  const lastName = user.lastName || fullParts.slice(1).join(' ') || ext?.lastName || '';

  return { firstName, lastName };
}

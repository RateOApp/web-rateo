/**
 * Referral-code helpers shared by the join page, the register forms and the
 * social sign-up round trip.
 *
 * Codes are uppercase A-Z / 2-9 (no 0/O/1/I), 4-12 characters. Links may carry
 * a `RATEO-` prefix, and people paste them with stray spaces, so everything
 * that reaches the backend goes through `normaliseReferralCode` first.
 */

export const MIN_REFERRAL_CODE_LENGTH = 4;
export const MAX_REFERRAL_CODE_LENGTH = 12;

/** `" rateo-kadri7x "` -> `"KADRI7X"`. Returns `''` for anything unusable. */
export function normaliseReferralCode(value: string | null | undefined): string {
  if (!value) return '';
  const upper = value.toUpperCase().replace(/\s+/g, '');
  const bare = upper.startsWith('RATEO-') ? upper.slice('RATEO-'.length) : upper;
  return bare.replace(/[^A-Z0-9]/g, '').slice(0, MAX_REFERRAL_CODE_LENGTH);
}

/** True once the code is long enough to be worth looking up. */
export function isLookupableReferralCode(code: string): boolean {
  return code.length >= MIN_REFERRAL_CODE_LENGTH;
}

/** First value of a `searchParams` entry, which Next types as string | string[]. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * `sessionStorage` key that carries the code across the Clerk OAuth redirect.
 * Same name as the mobile app's AsyncStorage key, on purpose.
 */
export const PENDING_REFERRAL_KEY = 'pendingReferralCode';

/** Best effort: private mode / disabled storage must never break sign-up. */
export function storePendingReferralCode(code: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const normalised = normaliseReferralCode(code);
  try {
    if (normalised) window.sessionStorage.setItem(PENDING_REFERRAL_KEY, normalised);
    else window.sessionStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {
    // Nothing to do - the signup simply proceeds without the code.
  }
}

export function readPendingReferralCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    return normaliseReferralCode(window.sessionStorage.getItem(PENDING_REFERRAL_KEY));
  } catch {
    return '';
  }
}

export function clearPendingReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {
    // Ignored, same as above.
  }
}

/**
 * Account enforcement (suspended / banned) on the client.
 *
 * The backend answers a login or any authenticated call on a restricted
 * account with `403 { code: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED',
 * enforcement, appealToken }`. We keep that notice in sessionStorage so the
 * public `/account-restricted` page can render it after the session cookies
 * are dropped.
 */

export const RESTRICTION_STORAGE_KEY = 'rateo_account_restriction';
export const RESTRICTED_PATH = '/account-restricted';

export type AppealStatus = 'open' | 'upheld' | 'overturned';

export type Enforcement = {
  status: 'suspended' | 'banned';
  reasonLabel?: string;
  userMessage?: string;
  policyUrl?: string;
  /** ISO date, or null for an indefinite suspension. */
  suspendedUntil?: string | null;
  appealAllowed?: boolean;
  appealStatus?: AppealStatus | null;
};

export type StoredRestriction = {
  enforcement: Enforcement;
  appealToken: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isRestrictionCode(code: unknown): boolean {
  return code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_BANNED';
}

/** True for a 403 body that describes a suspended/banned account. */
export function isRestrictionBody(status: number | undefined, body: unknown): boolean {
  if (status !== 403 || !isRecord(body)) return false;
  if (isRestrictionCode(body.code)) return true;
  return typeof body.message === 'string' && /account suspended/i.test(body.message);
}

/** Normalises a 403 body (or socket payload) into what the page needs. */
export function buildRestriction(body: unknown): StoredRestriction {
  const data = isRecord(body) ? body : {};
  const enf = isRecord(data.enforcement) ? data.enforcement : {};
  const banned = data.code === 'ACCOUNT_BANNED' || enf.status === 'banned';
  return {
    enforcement: {
      status: banned ? 'banned' : 'suspended',
      reasonLabel: typeof enf.reasonLabel === 'string' ? enf.reasonLabel : undefined,
      userMessage: typeof enf.userMessage === 'string' ? enf.userMessage : undefined,
      policyUrl: typeof enf.policyUrl === 'string' ? enf.policyUrl : undefined,
      suspendedUntil: typeof enf.suspendedUntil === 'string' ? enf.suspendedUntil : null,
      appealAllowed: enf.appealAllowed !== false,
      appealStatus:
        enf.appealStatus === 'open' || enf.appealStatus === 'upheld' || enf.appealStatus === 'overturned'
          ? enf.appealStatus
          : null,
    },
    appealToken: typeof data.appealToken === 'string' ? data.appealToken : null,
  };
}

export function storeRestriction(restriction: StoredRestriction): void {
  try {
    window.sessionStorage.setItem(RESTRICTION_STORAGE_KEY, JSON.stringify(restriction));
  } catch {
    // Storage blocked: the page falls back to its generic message.
  }
}

export function readRestriction(): StoredRestriction | null {
  try {
    const raw = window.sessionStorage.getItem(RESTRICTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.enforcement)) return null;
    return buildRestriction({
      enforcement: parsed.enforcement,
      appealToken: parsed.appealToken,
    });
  } catch {
    return null;
  }
}

export function clearRestriction(): void {
  try {
    window.sessionStorage.removeItem(RESTRICTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

let handling = false;

/**
 * Store the notice, drop the httpOnly session cookies, then hard-navigate to
 * the restricted page (a full load discards every cached RSC payload and query
 * result belonging to the restricted account). Idempotent per page load.
 */
export function handleRestriction(body: unknown): void {
  if (typeof window === 'undefined') return;
  storeRestriction(buildRestriction(body));
  if (handling) return;
  handling = true;

  const go = () => {
    if (window.location.pathname !== RESTRICTED_PATH) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(RESTRICTED_PATH);
    }
  };
  // Bare fetch, not axios: the axios interceptor must not re-enter itself.
  fetch('/api/auth/logout', { method: 'POST' })
    .catch(() => {})
    .finally(go);
}

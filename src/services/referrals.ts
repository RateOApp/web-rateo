import { api } from '@/lib/api/client';
import { normaliseReferralCode } from '@/lib/referral-code';
import type {
  ApplyReferralResponse,
  MyReferral,
  ReferralCodeLookup,
  ReferralListParams,
  ReferralListResponse,
  ReferralSource,
} from '@/types/referrals';

/**
 * Referral program, browser half. Mirrors `invitations.ts`: plain functions on
 * the same-origin `/api` proxy, with the TanStack wrappers in
 * `@/hooks/use-referrals`.
 *
 * `lookupCode` is public (it is used on `/register` before a session exists);
 * everything else needs the session cookie, which the proxy attaches.
 */
export const referralsService = {
  /**
   * Validate a code. Never throws for an unknown code - the backend answers
   * 200 `{ valid: false }` - so only a network / rate-limit failure rejects.
   */
  lookupCode(code: string): Promise<ReferralCodeLookup> {
    const normalised = normaliseReferralCode(code);
    return api
      .get<ReferralCodeLookup>(`/referrals/code/${encodeURIComponent(normalised)}`)
      .then((r) => r.data);
  },

  /** My own code, share copy and rollup stats. Generates a code if missing. */
  getMyReferral(): Promise<MyReferral> {
    return api.get<MyReferral>('/referrals/me').then((r) => r.data);
  },

  /** People I referred, newest first. Page size is the backend default. */
  getMyReferralList(params: ReferralListParams = {}): Promise<ReferralListResponse> {
    const query: Record<string, string> = {};
    if (params.status && params.status !== 'all') query.status = params.status;
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);

    return api
      .get<ReferralListResponse>('/referrals/me/list', { params: query })
      .then((r) => r.data);
  },

  /**
   * Late apply, for flows that could not send the code at signup (Google
   * sign-in, clipboard-after-install). A refusal comes back as a 400 whose
   * body is still `{ applied: false, reason, message }`.
   */
  applyReferral(code: string, source: ReferralSource = 'web'): Promise<ApplyReferralResponse> {
    return api
      .post<ApplyReferralResponse>('/referrals/apply', {
        code: normaliseReferralCode(code),
        source,
      })
      .then((r) => r.data);
  },
};

import { serverFetch, type ServerFetchInit } from '@/lib/api/server';
import { normaliseReferralCode } from '@/lib/referral-code';
import type { ReferralCodeLookup } from '@/types/referrals';

/**
 * RSC half of the referral API - only the public code lookup, which is what
 * `/join/[code]` and its OG image render from. Split from `referralsService`
 * because `@/lib/api/server` imports `server-only`.
 */
export const referralsServer = {
  /**
   * `GET referrals/code/:code`, unauthenticated and cacheable. An empty or
   * malformed code is resolved locally as `{ valid: false }` rather than sent.
   */
  async lookupCode(code: string, init?: ServerFetchInit): Promise<ReferralCodeLookup> {
    const normalised = normaliseReferralCode(code);
    if (!normalised) return { valid: false };

    return serverFetch<ReferralCodeLookup>(
      `referrals/code/${encodeURIComponent(normalised)}`,
      init,
    );
  },
};

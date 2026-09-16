import type { Paginated, Role } from '@/types/api';

/**
 * Referral program types (server-rateo `referralController`).
 *
 * A referral is recorded at signup as `pending` and flips to `verified` only
 * when the referred account reaches `kycStatus === 'verified'`. `void` is an
 * admin fraud decision. Referred users are never returned with contact details.
 */

export type ReferralStatus = 'pending' | 'verified' | 'void';

/** Where the code came from. The web app only ever sends `'web'`. */
export type ReferralSource = 'typed' | 'link' | 'clipboard' | 'social' | 'web';

/** The web app's own source tag, sent with register / social-login / apply. */
export const REFERRAL_SOURCE_WEB = 'web' as const;

/**
 * `GET referrals/code/:code` — public and rate-limited. An unknown or invalid
 * code is NOT an error: the endpoint answers 200 `{ valid: false }`.
 */
export type ReferralCodeLookup = {
  valid: boolean;
  referrerName?: string;
  referrerRole?: Role;
  isAmbassador?: boolean;
};

export type ReferralStats = {
  total: number;
  pending: number;
  verified: number;
  void: number;
};

/** `GET referrals/me` — generates a code server-side when the user has none. */
export type MyReferral = {
  code: string;
  shareUrl: string;
  shareMessage: string;
  isAmbassador: boolean;
  ambassadorSince?: string | null;
  stats: ReferralStats;
};

/** One referred account, as returned by `GET referrals/me/list`. */
export type ReferredUser = {
  _id: string;
  name?: string;
  role?: Role;
  avatar?: string;
  status: ReferralStatus;
  source?: ReferralSource | (string & {});
  createdAt?: string;
  verifiedAt?: string | null;
};

export type ReferralListResponse = Paginated & {
  referrals: ReferredUser[];
  total: number;
  stats?: ReferralStats;
};

export type ReferralListParams = {
  /** Omit (or `'all'`) for every status. */
  status?: ReferralStatus | 'all';
  page?: number;
  limit?: number;
};

/**
 * `POST referrals/apply`. The late-apply rules (no existing referrer, account
 * younger than 7 days, not yet KYC-verified) are enforced server-side and a
 * refusal comes back as 400 `{ applied: false, reason, message }`.
 */
export type ApplyReferralResponse = {
  applied: boolean;
  code?: string;
  referrerName?: string;
  referrerRole?: Role;
  status?: ReferralStatus;
  reason?: string;
  message?: string;
};

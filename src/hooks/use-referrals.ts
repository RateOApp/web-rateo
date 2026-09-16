'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { isLookupableReferralCode, normaliseReferralCode } from '@/lib/referral-code';
import { referralsService } from '@/services/referrals';
import type { ReferralListResponse, ReferralStatus } from '@/types/referrals';

/** Key shared by the dashboard card and anything that needs the code. */
export const MY_REFERRAL_KEY = ['myReferral'] as const;

/** My code, share copy and stats. */
export function useMyReferral(enabled = true) {
  return useQuery({
    queryKey: MY_REFERRAL_KEY,
    queryFn: () => referralsService.getMyReferral(),
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * People I referred, paged with "Load more". `useInfiniteQuery` keeps the
 * already-loaded pages when the filter is unchanged; switching the status
 * filter is a new key, so it starts from page 1 again.
 */
export function useMyReferralList(status: ReferralStatus | 'all' = 'all', enabled = true) {
  return useInfiniteQuery<ReferralListResponse>({
    queryKey: ['myReferralList', status] as const,
    queryFn: ({ pageParam }) =>
      referralsService.getMyReferralList({ status, page: pageParam as number }),
    enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage?.page ?? 1;
      const pages = lastPage?.pages ?? 1;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Inline "Referred by …" hint on the register forms. The caller debounces the
 * code; this hook only fires once it is long enough to be a real code.
 *
 * `retry: false` on purpose - the lookup is rate-limited and the hint is
 * decoration, it must never block or slow down a signup.
 */
export function useReferralCodeLookup(code: string) {
  const normalised = normaliseReferralCode(code);

  return useQuery({
    queryKey: ['referralCode', normalised] as const,
    queryFn: () => referralsService.lookupCode(normalised),
    enabled: isLookupableReferralCode(normalised),
    retry: false,
    staleTime: Infinity,
  });
}

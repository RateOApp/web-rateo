'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { importedJobsService } from '@/services/imported-jobs';

/** Claims an imported listing from its emailed token. See `ClaimButton`. */
export function useClaimListing() {
  return useMutation({
    mutationFn: (token: string) => importedJobsService.claimListing(token),
  });
}

/** Claimed listings awaiting KYC. Companies only - pass `enabled` from role. */
export function useMyClaims(enabled = true) {
  return useQuery({
    queryKey: ['imported-jobs', 'claims', 'mine'],
    queryFn: () => importedJobsService.myClaims(),
    enabled,
    staleTime: 60_000,
  });
}

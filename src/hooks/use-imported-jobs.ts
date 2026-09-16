'use client';

import { useMutation } from '@tanstack/react-query';

import { importedJobsService } from '@/services/imported-jobs';

/** Claims an imported listing from its emailed token. See `ClaimButton`. */
export function useClaimListing() {
  return useMutation({
    mutationFn: (token: string) => importedJobsService.claimListing(token),
  });
}

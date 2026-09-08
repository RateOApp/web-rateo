'use client';

import { useQuery } from '@tanstack/react-query';

import { candidatesService } from '@/services/candidates';

/** Cache key shared by the home feed, Explore and the Saved talents tab. */
export const SAVED_CANDIDATES_KEY = ['savedCandidates'] as const;

/**
 * `GET /users/saved`. Companies only - the endpoint reads the caller's own
 * `savedCandidates`, so an individual just gets an empty list.
 */
export function useSavedCandidates(enabled = true) {
  return useQuery({
    queryKey: SAVED_CANDIDATES_KEY,
    queryFn: () => candidatesService.saved(),
    enabled,
    staleTime: 60_000,
  });
}

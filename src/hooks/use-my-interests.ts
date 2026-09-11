'use client';

import { useQuery } from '@tanstack/react-query';

import { jobsService } from '@/services/jobs';

/** Cache key shared by Saved, the job feed and the job detail actions. */
export const MY_INTERESTS_KEY = ['myInterests'] as const;

/**
 * `GET /imported-jobs/interests/mine`. Individuals only - the server 403s for
 * companies, so pass `enabled` from the viewer's role.
 */
export function useMyInterests(enabled = true) {
  return useQuery({
    queryKey: MY_INTERESTS_KEY,
    queryFn: () => jobsService.myInterests(),
    enabled,
    staleTime: 60_000,
  });
}

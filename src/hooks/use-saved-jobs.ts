'use client';

import { useQuery } from '@tanstack/react-query';

import { jobsService } from '@/services/jobs';

/** Cache key shared by Saved, the job feed and the job detail actions. */
export const SAVED_JOBS_KEY = ['savedJobs'] as const;

/** `GET /jobs/user/saved`. Individuals only - the server 403s for companies. */
export function useSavedJobs(enabled = true) {
  return useQuery({
    queryKey: SAVED_JOBS_KEY,
    queryFn: () => jobsService.saved(),
    enabled,
    staleTime: 60_000,
  });
}

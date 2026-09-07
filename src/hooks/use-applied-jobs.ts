'use client';

import { useQuery } from '@tanstack/react-query';

import { jobsService } from '@/services/jobs';

/** Cache key shared by Saved and the job detail actions. */
export const APPLIED_JOBS_KEY = ['appliedJobs'] as const;

/** `GET /jobs/user/applied`. Individuals only - the server 403s for companies. */
export function useAppliedJobs(enabled = true) {
  return useQuery({
    queryKey: APPLIED_JOBS_KEY,
    queryFn: () => jobsService.applied(),
    enabled,
    staleTime: 60_000,
  });
}

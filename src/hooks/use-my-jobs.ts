'use client';

import { useQuery } from '@tanstack/react-query';

import { jobsService } from '@/services/jobs';

/** Cache key shared by My jobs, the candidates hub and every job mutation. */
export const MY_JOBS_KEY = ['myJobs'] as const;

/** `GET /jobs/company/myjobs`. Companies only - the server 403s otherwise. */
export function useMyJobs(enabled = true) {
  return useQuery({
    queryKey: MY_JOBS_KEY,
    queryFn: () => jobsService.myJobs(),
    enabled,
    staleTime: 60_000,
  });
}

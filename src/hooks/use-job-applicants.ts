'use client';

import { useQuery } from '@tanstack/react-query';

import { jobsService } from '@/services/jobs';

/** Per-job cache key; invalidated after every applicant status change. */
export function jobApplicantsKey(jobId: string | undefined) {
  return ['jobApplicants', jobId] as const;
}

/** `GET /jobs/:id/applicants`. Owner only. */
export function useJobApplicants(jobId: string | undefined) {
  return useQuery({
    queryKey: jobApplicantsKey(jobId),
    queryFn: () => jobsService.applicants(jobId as string),
    enabled: Boolean(jobId),
  });
}

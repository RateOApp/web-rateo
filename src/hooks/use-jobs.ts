'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { jobsService } from '@/services/jobs';
import type { JobListParams } from '@/services/params';

/**
 * Paginated job feed. Page size is fixed at 10 server-side and `limit` is
 * ignored, so pagination is driven purely by `page` / `pages`.
 */
export function useJobs(params: JobListParams = {}) {
  return useInfiniteQuery({
    queryKey: ['jobs', params] as const,
    queryFn: ({ pageParam }) => jobsService.list({ ...params, pageNumber: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
}

/**
 * Key for the personalised home feed (no `categories` param - see
 * `jobsService.feed`). Shared by the feed itself and everything that mutates a
 * card on it (saving a job, registering / withdrawing interest).
 */
export const JOB_FEED_KEY = ['jobs', 'personalised'] as const;

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id] as const,
    queryFn: () => jobsService.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useJobCategories() {
  return useQuery({
    queryKey: ['jobCategories'] as const,
    queryFn: () => jobsService.categories(),
    staleTime: 10 * 60 * 1000,
  });
}

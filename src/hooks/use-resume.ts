'use client';

import { useQuery } from '@tanstack/react-query';

import { usersService } from '@/services/users';

/**
 * The stored resume URL. Key `['resume', id]`.
 *
 * `usersService.resume` folds the controller's 404 ("No resume found") into
 * `{ resume: null }`, so an empty state is data rather than an error - and
 * `retry` stays off so a genuinely missing resume never costs a second call.
 */
export function useResume(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['resume', userId ?? ''] as const,
    queryFn: () => usersService.resume(userId as string),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    retry: false,
  });
}

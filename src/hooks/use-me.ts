'use client';

import { useQuery } from '@tanstack/react-query';

import { usersService } from '@/services/users';

/**
 * The signed-in user.
 *
 * `retry: false` on purpose: a 401 here means the session is gone, and the
 * axios interceptor has already cleared the cookies and bounced the user out of
 * the protected areas. Retrying would just fire more logouts.
 */
export function useMe() {
  return useQuery({
    queryKey: ['me'] as const,
    queryFn: () => usersService.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

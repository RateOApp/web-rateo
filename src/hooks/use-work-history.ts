'use client';

import { useQuery } from '@tanstack/react-query';

import { usersService } from '@/services/users';

/**
 * A user's work history. Key `['workHistory', id]`.
 *
 * Unlike the mobile app - which fetches the whole user and then resolves every
 * `companyId` one request at a time - this hits `GET /users/:id/work-history`,
 * where the controller already populated the company name and logo.
 */
export function useWorkHistory(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['workHistory', userId ?? ''] as const,
    queryFn: () => usersService.workHistory(userId as string),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

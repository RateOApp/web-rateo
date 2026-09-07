'use client';

import { useQuery } from '@tanstack/react-query';

import { notificationsService } from '@/services/notifications';

/** Key shared by the bell badge and the notifications page. */
export const NOTIFICATIONS_KEY = ['notifications'] as const;

/**
 * The signed-in user's notifications. Polled once a minute so the header bell
 * stays roughly live until sockets land in Phase 6.
 */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationsService.list(),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';

import { participationService } from '@/services/participation';

/** Own participation state. Key `['participationStatus']`. */
export function useParticipationStatus(enabled = true) {
  return useQuery({
    queryKey: ['participationStatus'] as const,
    queryFn: () => participationService.status(),
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Someone else's participation score/history. Key `['participationOf', id]`. */
export function useParticipationOf(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['participationOf', userId ?? ''] as const,
    queryFn: () => participationService.of(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}

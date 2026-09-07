'use client';

import { useQuery } from '@tanstack/react-query';

import { reviewsService } from '@/services/reviews';

/** Reviews about a user or company. Key `['userReviews', id]`. */
export function useUserReviews(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['userReviews', userId ?? ''] as const,
    queryFn: () => reviewsService.byUser(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}

/** Whether the signed-in user still owes this month's rating. Key `['monthlyPrompt']`. */
export function useMonthlyPrompt(enabled = true) {
  return useQuery({
    queryKey: ['monthlyPrompt'] as const,
    queryFn: () => reviewsService.monthlyStatus(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

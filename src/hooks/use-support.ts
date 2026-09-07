'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supportService } from '@/services/support';
import type { CreateTicketPayload, SendMessagePayload } from '@/types/support';

/** The signed-in user's problem reports. Key `['supportTickets']`. */
export function useSupportTickets(enabled = true) {
  return useQuery({
    queryKey: ['supportTickets'] as const,
    queryFn: () => supportService.list(),
    enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * One ticket, polled every 15 s so admin replies land without a refresh.
 * Sockets take over in Phase 6.
 */
export function useSupportTicket(id: string | null | undefined) {
  return useQuery({
    queryKey: ['supportTicket', id ?? ''] as const,
    queryFn: () => supportService.byId(id as string),
    enabled: Boolean(id),
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => supportService.create(payload),
    onSuccess: () => {
      // A new ticket closes every other open one server-side.
      void queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
  });
}

export function useSendTicketMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => supportService.sendMessage(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['supportTicket', id] });
    },
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';

import { messagesService } from '@/services/messages';

/** Keys are shared with the socket provider's invalidations - keep them here. */
export const CONVERSATIONS_KEY = ['conversations'] as const;
export const UNREAD_MESSAGES_KEY = ['unreadMessages'] as const;

/** One row per chat partner, with the last message and my unread count. */
export function useConversations(enabled = true) {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => messagesService.conversations(),
    enabled,
    staleTime: 15 * 1000,
  });
}

/**
 * One thread, ascending. `staleTime: 0` because the socket invalidates this key
 * on reconnect and the thread merges live events on top of it.
 */
export function useThread(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['messages', userId ?? ''] as const,
    queryFn: () => messagesService.thread(userId as string),
    enabled: Boolean(userId),
    staleTime: 0,
  });
}

/**
 * The header badge count. Sockets refresh it on every
 * `new_message_notification`; the 60 s poll is the safety net for a session
 * whose socket never connected (legacy server down, blocked WebSocket).
 */
export function useUnreadMessages(enabled = true) {
  return useQuery({
    queryKey: UNREAD_MESSAGES_KEY,
    queryFn: () => messagesService.unreadCount(),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/**
 * `GET /users/:id/full` for the chat header, the profile sheet and - when
 * called with my own id - my `blockedUsers` list.
 */
export function useChatProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['chatProfile', userId ?? ''] as const,
    queryFn: () => messagesService.fullProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

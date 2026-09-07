import { api } from '@/lib/api/client';
import type { ApiMessage } from '@/types/api';
import type { AppNotification, NotificationsPayload } from '@/types/dashboard';

/** `GET /notifications` answers with a bare array, or `{ notifications }`. */
export function normaliseNotifications(data: NotificationsPayload | null | undefined) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.notifications)) return data.notifications;
  return [] as AppNotification[];
}

export const notificationsService = {
  list(): Promise<AppNotification[]> {
    return api
      .get<NotificationsPayload>('/notifications')
      .then((r) => normaliseNotifications(r.data));
  },

  markRead(id: string): Promise<AppNotification> {
    return api.put<AppNotification>(`/notifications/${id}/read`).then((r) => r.data);
  },

  markAllRead(): Promise<ApiMessage> {
    return api.put<ApiMessage>('/notifications/read/all').then((r) => r.data);
  },

  remove(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/notifications/${id}`).then((r) => r.data);
  },
};

import { api } from '@/lib/api/client';
import type { ApiMessage, User } from '@/types/api';
import type {
  ChatImageUploadResponse,
  Conversation,
  Message,
  SendMessagePayload,
  UnreadCountResponse,
} from '@/types/messages';

/**
 * Direct messaging. Routes: `server-rateo/src/routes/messageRoutes.js` and the
 * block / report / full-profile routes in `userRoutes.js`.
 *
 * Everything except `conversations`, `unreadCount` and `thread` is behind
 * `requireKycVerified` server-side, so an unverified caller gets a 403 with a
 * KYC message - the KYC gate pre-empts that in the UI.
 */
export const messagesService = {
  /** `GET /messages/conversations` - newest last message first. */
  conversations(): Promise<Conversation[]> {
    return api
      .get<Conversation[] | { conversations?: Conversation[] }>('/messages/conversations')
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.conversations ?? [])));
  },

  /** `GET /messages/:userId` - ascending by `createdAt`, deleted rows excluded. */
  thread(userId: string): Promise<Message[]> {
    return api
      .get<Message[] | { messages?: Message[] }>(`/messages/${encodeURIComponent(userId)}`)
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.messages ?? [])));
  },

  /** `POST /messages` - answers 201 with the populated message. */
  send(payload: SendMessagePayload): Promise<Message> {
    return api
      .post<Message>('/messages', {
        receiverId: payload.receiverId,
        content: payload.content ?? '',
        replyTo: payload.replyTo ?? null,
        attachments: payload.attachments ?? [],
      })
      .then((r) => r.data);
  },

  /**
   * `POST /messages/upload`, multipart field `image` -> `{ url }` (Cloudinary).
   * Never set `Content-Type` by hand: the browser must add the boundary.
   */
  uploadImage(file: File): Promise<ChatImageUploadResponse> {
    const body = new FormData();
    body.append('image', file);
    return api.post<ChatImageUploadResponse>('/messages/upload', body).then((r) => r.data);
  },

  /** `PUT /messages/:id` - sender only; sets `isEdited`. */
  edit(id: string, content: string): Promise<Message> {
    return api
      .put<Message>(`/messages/${encodeURIComponent(id)}`, { content })
      .then((r) => r.data);
  },

  /** `DELETE /messages/:id` - a soft delete; the bubble becomes "Message deleted". */
  remove(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/messages/${encodeURIComponent(id)}`).then((r) => r.data);
  },

  /**
   * `POST /messages/:id/react`. The controller drops this user's existing
   * reaction first, so an empty emoji removes it.
   */
  react(id: string, emoji: string): Promise<Message> {
    return api
      .post<Message>(`/messages/${encodeURIComponent(id)}/react`, { emoji })
      .then((r) => r.data);
  },

  /** `POST /messages/:id/report` - notifies admins. */
  report(id: string, reason: string, details?: string): Promise<ApiMessage> {
    return api
      .post<ApiMessage>(`/messages/${encodeURIComponent(id)}/report`, { reason, details })
      .then((r) => r.data);
  },

  /**
   * `PUT /messages/read/:senderId` - marks everything that user sent me as
   * read and emits `messages_read` into the pair room.
   */
  markRead(userId: string): Promise<ApiMessage> {
    return api
      .put<ApiMessage>(`/messages/read/${encodeURIComponent(userId)}`)
      .then((r) => r.data);
  },

  /** `GET /messages/unread-count` -> the badge number. */
  unreadCount(): Promise<number> {
    return api
      .get<UnreadCountResponse>('/messages/unread-count')
      .then((r) => (typeof r.data?.count === 'number' ? r.data.count : 0));
  },

  blockUser(id: string): Promise<ApiMessage> {
    return api.post<ApiMessage>(`/users/${encodeURIComponent(id)}/block`).then((r) => r.data);
  },

  /** Unblock is the DELETE verb on the same path. */
  unblockUser(id: string): Promise<ApiMessage> {
    return api.delete<ApiMessage>(`/users/${encodeURIComponent(id)}/block`).then((r) => r.data);
  },

  reportUser(id: string, reason: string, details?: string): Promise<ApiMessage> {
    return api
      .post<ApiMessage>(`/users/${encodeURIComponent(id)}/report`, { reason, details })
      .then((r) => r.data);
  },

  /**
   * `GET /users/:id/full`. For MY OWN id the controller returns everything,
   * including `blockedUsers` (populated) - that is where the block banner's
   * "you blocked them" state comes from. For anyone else it is the public
   * profile with `blockedUsers` stripped, so "they blocked me" can only be
   * learned from a 403 on send.
   */
  fullProfile(id: string): Promise<User> {
    return api.get<User>(`/users/${encodeURIComponent(id)}/full`).then((r) => r.data);
  },
};

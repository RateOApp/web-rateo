/**
 * Socket.IO event maps.
 *
 * Source of truth: `server-rateo/src/index.js` (connection handler) plus every
 * `io.to(...).emit(...)` in the controllers, catalogued in `docs/REALTIME.md`.
 *
 * Two shapes are deliberately loose because the server is mid-migration:
 * - `message_updated` for `edit` / `react` currently emits the UNPOPULATED
 *   document, so `message.sender` can be an ObjectId string.
 * - `message_updated` for `delete` carries `messageId` today and will carry
 *   `message` as well once the backend change lands; both are handled.
 */

import type { PublicKycStatus, Role } from '@/types/api';
import type { AppNotification } from '@/types/dashboard';
import type { Message } from '@/types/messages';
import type { SupportMessage, SupportTicketStatus } from '@/types/support';

/** `{ reader, sender }` - ids of the reader and the sender whose messages were read. */
export type MessagesReadPayload = { reader: string; sender: string };

/** Emitted into the pair room after an edit, reaction or delete. */
export type MessageUpdatedPayload =
  | { type: 'edit' | 'react'; message: Message; messageId?: string }
  | { type: 'delete'; messageId: string; message?: Message };

/** `typing` / `stop_typing` travel in both directions with the same shape. */
export type TypingPayload = { room: string; senderId: string };

export type UserBlockedPayload = {
  blockedBy: string | { _id: string };
  blockedUser: string | { _id: string };
};

export type UserUnblockedPayload = {
  unblockedBy: string | { _id: string };
  unblockedUser: string | { _id: string };
};

/** An admin suspended or reinstated the account. */
export type AccountStatusChangedPayload = {
  userId: string;
  isActive: boolean;
  reason?: string;
};

/** A KYC decision landed for this account. */
export type KycUpdatedPayload = {
  userId: string;
  role?: Role;
  kyc?: { status?: PublicKycStatus };
  message?: string;
  at?: string;
};

/** A support (problem report) reply, usually from an admin. */
export type ProblemReportMessagePayload = {
  reportId: string;
  message?: SupportMessage;
};

export type ProblemReportStatusPayload = {
  reportId: string;
  /** The admin tooling emits capitalised labels, the model stores open/closed. */
  status: 'Open' | 'Resolved' | SupportTicketStatus;
};

/** Admin-only broadcast; the web app ignores the body. */
export type ProblemReportChangedPayload = { reportId?: string };

/**
 * Sent by the hardened handshake when a socket asks for a room it may not
 * join. Legacy servers never emit it; the client only logs in development.
 */
export type RoomDeniedPayload = { room: string; reason?: string };

export type ServerToClientEvents = {
  receive_message: (message: Message) => void;
  new_message_notification: (message: Message) => void;
  messages_read: (payload: MessagesReadPayload) => void;
  message_updated: (payload: MessageUpdatedPayload) => void;
  typing: (payload: TypingPayload) => void;
  stop_typing: (payload: TypingPayload) => void;
  notification: (payload: AppNotification) => void;
  user_blocked: (payload: UserBlockedPayload) => void;
  user_unblocked: (payload: UserUnblockedPayload) => void;
  account_status_changed: (payload: AccountStatusChangedPayload) => void;
  kyc_updated: (payload: KycUpdatedPayload) => void;
  problem_report_message: (payload: ProblemReportMessagePayload) => void;
  problem_report_status_updated: (payload: ProblemReportStatusPayload) => void;
  problem_report_changed: (payload: ProblemReportChangedPayload) => void;
  room_denied: (payload: RoomDeniedPayload) => void;
};

export type ClientToServerEvents = {
  join_room: (room: string) => void;
  typing: (payload: TypingPayload) => void;
  stop_typing: (payload: TypingPayload) => void;
};

/** `GET /api/auth/socket` - `ticket` is `null` on deployments without the endpoint. */
export type SocketSession = {
  url: string;
  ticket: string | null;
  expiresIn?: number;
};

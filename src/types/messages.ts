/**
 * Direct messages.
 *
 * Source of truth: `server-rateo/src/models/Message.js` and
 * `src/controllers/messageController.js`. Mongo documents come back loosely
 * populated - `sender`, `receiver`, `replyTo` and `reaction.user` are populated
 * on some emissions and raw ObjectId strings on others (the edit/react socket
 * emissions currently skip `populate`) - so every reference type here accepts
 * both shapes and is narrowed with the helpers at the bottom.
 */

import type { Role, User } from '@/types/api';

/** The projection the conversation aggregate and the populate calls return. */
export type MessageUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  companyName?: string;
  role?: Role;
};

/** Either a populated document or the raw ObjectId string. */
export type UserRef = string | MessageUser;

export type MessageReaction = {
  _id?: string;
  user?: UserRef;
  emoji?: string;
};

/** `replyTo` is populated with `content` + `sender` only. */
export type ReplyPreview = {
  _id: string;
  content?: string;
  sender?: UserRef;
};

export type Message = {
  _id: string;
  sender?: UserRef;
  receiver?: UserRef;
  content?: string;
  attachments?: string[];
  read?: boolean;
  replyTo?: string | ReplyPreview | null;
  isDeleted?: boolean;
  isEdited?: boolean;
  reactions?: MessageReaction[];
  createdAt?: string;
  updatedAt?: string;
};

/** `GET /messages/conversations` - one row per chat partner, newest first. */
export type Conversation = {
  user: MessageUser;
  lastMessage?: Message;
  unreadCount?: number;
};

/** `GET /messages/unread-count`. */
export type UnreadCountResponse = { count?: number };

/** `POST /messages/upload`, multipart field `image` -> the Cloudinary URL. */
export type ChatImageUploadResponse = { url: string; message?: string };

/** `POST /messages`. Either `content` or `attachments` must be non-empty. */
export type SendMessagePayload = {
  receiverId: string;
  content?: string;
  replyTo?: string | null;
  attachments?: string[];
};

/** Local-only send state for an optimistic bubble. */
export type OutgoingStatus = 'sending' | 'failed';

/**
 * A message as the thread renders it: server documents plus the optimistic
 * bubbles that have not been acknowledged yet. `localPayload` is kept so the
 * retry button can resend exactly what failed.
 */
export type ThreadMessage = Message & {
  localStatus?: OutgoingStatus;
  localPayload?: SendMessagePayload;
};

/** Reaction picker, in the order the mobile action sheet shows them. */
export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'] as const;

/* -------------------------------------------------------------------------- */
/* Narrowing helpers                                                          */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** The id behind a reference that may be populated, a string, or missing. */
export function refId(ref: UserRef | null | undefined): string | null {
  if (typeof ref === 'string') return ref || null;
  if (isRecord(ref) && typeof ref._id === 'string') return ref._id;
  return null;
}

/** The populated document behind a reference, when there is one. */
export function refUser(ref: UserRef | null | undefined): MessageUser | null {
  return typeof ref === 'object' && ref !== null ? ref : null;
}

/** `companyName` wins, then `first last`, then a neutral fallback. */
export function messageUserName(
  user: Pick<MessageUser, 'firstName' | 'lastName' | 'companyName'> | null | undefined,
): string {
  if (!user) return 'Rate’O user';
  const person = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.companyName?.trim() || person || 'Rate’O user';
}

/** The other party of a conversation row, as the avatar helpers want it. */
export function conversationName(conversation: Conversation): string {
  return messageUserName(conversation.user);
}

/** List preview: the text, or **Photo** when the message is images only. */
export function messagePreview(message: Message | null | undefined): string {
  if (!message) return 'No messages yet';
  if (message.isDeleted) return 'Message deleted';
  const text = message.content?.trim();
  if (text) return text;
  return message.attachments?.length ? 'Photo' : 'No messages yet';
}

/** The pair room both participants join: `[a, b].sort().join('_')`. */
export function pairRoom(a: string, b: string): string {
  return [a, b].sort().join('_');
}

/**
 * Ids this account has blocked. `GET /users/:me/full` populates `blockedUsers`
 * with `firstName lastName companyName avatar`, while `/auth/verify-token`
 * returns raw ObjectIds - both shapes are accepted.
 */
export function blockedIds(user: User | null | undefined): string[] {
  const raw = (user as (User & { blockedUsers?: unknown }) | null | undefined)?.blockedUsers;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') {
      if (entry) ids.push(entry);
    } else if (isRecord(entry) && typeof entry._id === 'string') {
      ids.push(entry._id);
    }
  }
  return ids;
}

/** Reactions grouped for the chips under a bubble. */
export type ReactionGroup = { emoji: string; count: number; mine: boolean };

export function groupReactions(
  reactions: MessageReaction[] | undefined,
  myId: string | null,
): ReactionGroup[] {
  const groups = new Map<string, ReactionGroup>();
  for (const reaction of reactions ?? []) {
    const emoji = reaction.emoji?.trim();
    if (!emoji) continue;
    const existing = groups.get(emoji) ?? { emoji, count: 0, mine: false };
    existing.count += 1;
    if (myId && refId(reaction.user) === myId) existing.mine = true;
    groups.set(emoji, existing);
  }
  return [...groups.values()];
}

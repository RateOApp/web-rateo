"use client";

import Link from "next/link";
import { format, isToday } from "date-fns";
import { dayLabel } from "@/components/messages/date-divider";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { conversationName, messagePreview, type Conversation } from "@/types/messages";

/** Time for today's chats, a day label for older ones. */
function stamp(value: string | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return isToday(date) ? format(date, "HH:mm") : (dayLabel(date) ?? "");
}

/**
 * One row of the conversation list. `onOpen` returns `false` when the KYC gate
 * swallowed the click, in which case the navigation is cancelled.
 */
export function ConversationRow({
  conversation,
  active = false,
  onOpen,
}: {
  conversation: Conversation;
  active?: boolean;
  onOpen?: (userId: string) => boolean;
}) {
  const id = conversation.user._id;
  const name = conversationName(conversation);
  const unread = conversation.unreadCount ?? 0;
  const preview = messagePreview(conversation.lastMessage);
  const time = stamp(conversation.lastMessage?.createdAt);

  return (
    <li>
      <Link
        href={`/dashboard/messages/${id}`}
        aria-current={active ? "page" : undefined}
        onClick={(event) => {
          if (onOpen && !onOpen(id)) event.preventDefault();
        }}
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-colors",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          active && "border-brand-100 bg-brand-50 hover:bg-brand-50",
        )}
      >
        <UserAvatar user={conversation.user} size="lg" className="shrink-0" />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-brand-900">{name}</span>
            {time ? (
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground">{time}</span>
            ) : null}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-xs",
                unread > 0 ? "font-medium text-brand-900" : "text-muted-foreground",
              )}
            >
              {preview}
            </span>
            {unread > 0 ? (
              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 px-1.5 text-[0.625rem] font-bold text-accent-600 tabular-nums">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

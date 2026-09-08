"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/hooks/use-messages";

/**
 * Header messages shortcut with the unread badge, for both roles.
 *
 * The count comes from `GET /messages/unread-count` and is refreshed by the
 * socket provider on every `new_message_notification`, with a 60 s poll as the
 * fallback for sessions whose socket never connected.
 */
export function MessagesIcon() {
  const { data } = useUnreadMessages();
  const unread = data ?? 0;
  const label = unread > 99 ? "99+" : String(unread);

  return (
    <Link
      href="/dashboard/messages"
      aria-label={unread ? `Messages, ${unread} unread` : "Messages"}
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <MessageCircle aria-hidden="true" className="size-5" />
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-bold text-white tabular-nums">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

/** Header bell with the unread badge (capped at 99+), polled every 60s. */
export function NotificationBell() {
  const { data } = useNotifications();
  const unread = (data ?? []).filter((notification) => !notification.read).length;
  const label = unread > 99 ? "99+" : String(unread);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Bell aria-hidden="true" className="size-5" />
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-bold text-white tabular-nums">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

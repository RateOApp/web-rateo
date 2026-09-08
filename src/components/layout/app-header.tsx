import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { MessagesIcon } from "@/components/layout/messages-icon";
import { NotificationBell } from "@/components/layout/notification-bell";
import { AppNavLinks } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import type { User } from "@/types/api";

/** Sticky dashboard header. Desktop nav mirrors the mobile bottom tabs. */
export function AppHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link
          href="/dashboard"
          aria-label="Rate'O dashboard"
          className="shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Logo height={26} priority />
        </Link>

        <nav aria-label="Dashboard" className="hidden md:block">
          <AppNavLinks role={user.role} />
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <MessagesIcon />
          <NotificationBell />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

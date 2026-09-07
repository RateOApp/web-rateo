import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/shared/logo";
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
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Bell aria-hidden="true" className="size-5" />
          </Link>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

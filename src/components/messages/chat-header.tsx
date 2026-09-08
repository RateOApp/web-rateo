"use client";

import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import type { MessageUser } from "@/types/messages";

/**
 * The thread's own header, below the app header. The back arrow only exists
 * under `md` - on desktop the conversation list is permanently in the left
 * pane, so there is nothing to go back to.
 */
export function ChatHeader({
  user,
  name,
  subtitle,
  onOpenProfile,
}: {
  user: Pick<MessageUser, "firstName" | "lastName" | "companyName" | "avatar"> | null;
  name: string;
  subtitle?: string;
  onOpenProfile: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border bg-white px-2 py-2 sm:px-3">
      <Button asChild variant="ghost" size="icon-lg" className="md:hidden">
        <Link href="/dashboard/messages" aria-label="Back to messages">
          <ArrowLeft aria-hidden="true" />
        </Link>
      </Button>

      <UserAvatar
        user={user ?? { firstName: name }}
        size="default"
        className="ml-1 shrink-0 md:ml-2"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-900">{name}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={`Profile and options for ${name}`}
        onClick={onOpenProfile}
      >
        <MoreHorizontal aria-hidden="true" />
      </Button>
    </header>
  );
}

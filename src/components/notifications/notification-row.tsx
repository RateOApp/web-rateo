"use client";

import { useState } from "react";
import { Bell, MoreVertical, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { notificationBody, type AppNotification } from "@/types/dashboard";

/** "Just now" / "12m" / "5h" / "3 Sep 2026" - matches the mobile row. */
export function notificationTime(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return date.toLocaleDateString();
}

export function NotificationRow({
  notification,
  onOpen,
  onDelete,
  deleting = false,
}: {
  notification: AppNotification;
  onOpen: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const unread = !notification.read;
  const Icon = notification.type === "kyc" ? ShieldCheck : Bell;

  return (
    <li
      className={cn(
        "relative flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0",
        unread && "bg-brand-50/40",
      )}
    >
      {unread ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1 size-2 -translate-y-1/2 rounded-full bg-brand-700"
        />
      ) : null}

      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"
      >
        <Icon className="size-5" />
      </span>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className={cn("block text-sm", unread ? "font-semibold text-brand-900" : "text-brand-900")}>
          {notificationBody(notification)}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {notificationTime(notification.createdAt)}
          {unread ? <span className="sr-only"> (unread)</span> : null}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Notification options"
          disabled={deleting}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <MoreVertical aria-hidden="true" className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 aria-hidden="true" />
            Delete notification
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete notification</DialogTitle>
            <DialogDescription>This notification will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={deleting}
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

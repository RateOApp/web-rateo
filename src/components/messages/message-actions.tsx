"use client";

import { useState } from "react";
import { Copy, CornerUpLeft, Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REACTION_EMOJIS } from "@/types/messages";
import { cn } from "@/lib/utils";

type MessageActionsProps = {
  mine: boolean;
  /** Emoji already sent by me on this message, so a re-tap removes it. */
  myReaction: string | null;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onReport: () => void;
  className?: string;
};

/**
 * The per-bubble action menu - the web stand-in for the mobile long-press
 * sheet.
 *
 * The trigger stays in the DOM and is only visually hidden until the row is
 * hovered or something inside it takes focus, so it remains reachable by
 * keyboard and to assistive tech.
 */
export function MessageActions({
  mine,
  myReaction,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onReport,
  className,
}: MessageActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Message options"
            className={cn(
              "shrink-0 self-center text-muted-foreground opacity-0 transition-opacity",
              "group-hover/message:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100",
              className,
            )}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={mine ? "end" : "start"} className="w-48">
          <div className="flex items-center justify-between px-1 py-1.5">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={myReaction === emoji ? `Remove ${emoji} reaction` : `React ${emoji}`}
                aria-pressed={myReaction === emoji}
                onClick={() => onReact(myReaction === emoji ? "" : emoji)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-base transition-colors hover:bg-muted",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  myReaction === emoji && "bg-brand-50",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={onReply}>
            <CornerUpLeft aria-hidden="true" />
            Reply
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={onCopy}>
            <Copy aria-hidden="true" />
            Copy
          </DropdownMenuItem>

          {mine ? (
            <>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={onReport}>
              <Flag aria-hidden="true" />
              Report Message
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>Are you sure you want to delete this message?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

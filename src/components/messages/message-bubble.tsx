"use client";

import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import { MessageActions } from "@/components/messages/message-actions";
import { MessageImage } from "@/components/messages/message-image";
import { MessageText } from "@/components/messages/message-text";
import { toDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  groupReactions,
  messageUserName,
  refId,
  refUser,
  type ReplyPreview,
  type ThreadMessage,
} from "@/types/messages";

type MessageBubbleProps = {
  message: ThreadMessage;
  mine: boolean;
  /** My user id, to tell my own reactions apart from theirs. */
  myId: string | null;
  /** The other participant's display name, for the reply quote. */
  otherName: string;
  onReact: (message: ThreadMessage, emoji: string) => void;
  onReply: (message: ThreadMessage) => void;
  onEdit: (message: ThreadMessage) => void;
  onDelete: (message: ThreadMessage) => void;
  onReport: (message: ThreadMessage) => void;
  onRetry: (message: ThreadMessage) => void;
};

function replyPreview(value: ThreadMessage["replyTo"]): ReplyPreview | null {
  if (!value || typeof value === "string") return null;
  return value;
}

function timeLabel(value: string | undefined): string {
  const date = toDate(value);
  return date ? format(date, "HH:mm") : "";
}

/**
 * One message row: the bubble plus its hover menu.
 *
 * `whitespace-pre-wrap` on the body preserves the newlines the sender typed;
 * links are built as React elements by `MessageText`, never injected as HTML.
 */
export function MessageBubble({
  message,
  mine,
  myId,
  otherName,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onRetry,
}: MessageBubbleProps) {
  const deleted = message.isDeleted === true;
  const reply = deleted ? null : replyPreview(message.replyTo);
  const attachments = deleted ? [] : (message.attachments ?? []);
  const reactions = deleted ? [] : groupReactions(message.reactions, myId);
  const myReaction = reactions.find((group) => group.mine)?.emoji ?? null;
  const content = message.content?.trim() ?? "";

  const replySenderId = refId(reply?.sender);
  const replySenderDoc = refUser(reply?.sender);
  // `replyTo.sender` is populated by the API but not by the edit/react socket
  // emissions, so fall back to the header name we already know.
  const replySender =
    replySenderId && replySenderId === myId
      ? "You"
      : replySenderDoc
        ? messageUserName(replySenderDoc)
        : otherName;

  const status =
    message.localStatus === "sending"
      ? "Sending"
      : message.localStatus === "failed"
        ? "Failed"
        : message.read
          ? "Read"
          : "Sent";

  // A deleted message has no delivery state worth showing - "Sent" under
  // "Message deleted" reads like the deletion failed.
  const meta = [
    timeLabel(message.createdAt),
    message.isEdited && !deleted ? "Edited" : null,
    mine && !deleted ? status : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "group/message flex items-end gap-1",
        mine ? "flex-row-reverse justify-start" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 rounded-2xl px-3 py-2 sm:max-w-[70%]",
          mine
            ? "rounded-br-md bg-brand-700 text-white"
            : "rounded-bl-md border border-border bg-white text-brand-900",
          message.localStatus === "sending" && "opacity-70",
          message.localStatus === "failed" && "ring-1 ring-destructive",
        )}
      >
        {reply ? (
          <div
            className={cn(
              "flex gap-2 rounded-lg px-2 py-1.5",
              mine ? "bg-white/15" : "bg-muted",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("w-0.5 shrink-0 rounded-full", mine ? "bg-white/60" : "bg-brand-700")}
            />
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-xs font-semibold",
                  mine ? "text-white/90" : "text-brand-900",
                )}
              >
                {replySender}
              </span>
              <span
                className={cn(
                  "block truncate text-xs",
                  mine ? "text-white/75" : "text-muted-foreground",
                )}
              >
                {reply.content?.trim() || "Message unavailable"}
              </span>
            </span>
          </div>
        ) : null}

        {attachments.map((url, index) => (
          <MessageImage
            key={`${url}-${index}`}
            src={url}
            alt={content ? `Attachment: ${content}` : "Photo attachment"}
          />
        ))}

        {deleted ? (
          <p
            className={cn(
              "text-sm italic",
              mine ? "text-white/70" : "text-muted-foreground",
            )}
          >
            Message deleted
          </p>
        ) : content ? (
          <MessageText
            text={content}
            className={mine ? "text-white" : "text-brand-900"}
            linkClassName={mine ? "text-white" : "text-brand-700"}
          />
        ) : null}

        {reactions.length ? (
          <div className="flex flex-wrap gap-1">
            {reactions.map((group) => (
              <button
                key={group.emoji}
                type="button"
                aria-label={
                  group.mine
                    ? `Remove your ${group.emoji} reaction`
                    : `React ${group.emoji}, ${group.count} so far`
                }
                aria-pressed={group.mine}
                onClick={() => onReact(message, group.mine ? "" : group.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  mine
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-muted text-brand-900 hover:bg-brand-50",
                  group.mine && (mine ? "ring-1 ring-white/60" : "ring-1 ring-brand-700"),
                )}
              >
                <span aria-hidden="true">{group.emoji}</span>
                <span className="tabular-nums">{group.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        <p
          className={cn(
            "text-[0.6875rem]",
            mine ? "text-right text-white/70" : "text-muted-foreground",
          )}
        >
          {meta}
          {message.localStatus === "failed" ? (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="ml-1.5 inline-flex items-center gap-1 rounded font-semibold text-white underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RotateCcw aria-hidden="true" className="size-3" />
              Retry
            </button>
          ) : null}
        </p>
      </div>

      {deleted || message.localStatus ? null : (
        <MessageActions
          mine={mine}
          myReaction={myReaction}
          onReact={(emoji) => onReact(message, emoji)}
          onReply={() => onReply(message)}
          onEdit={() => onEdit(message)}
          onDelete={() => onDelete(message)}
          onCopy={() => void navigator.clipboard?.writeText(content)}
          onReport={() => onReport(message)}
        />
      )}
    </li>
  );
}

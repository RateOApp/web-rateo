"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2, MessageSquareWarning, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useSocketEvent } from "@/components/dashboard/socket-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSendTicketMessage, useSupportTicket } from "@/hooks/use-support";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { supportService } from "@/services/support";
import { cn } from "@/lib/utils";
import type { SupportMessage, SupportTicket } from "@/types/support";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg"];

function timestamp(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function Bubble({ message }: { message: SupportMessage }) {
  const mine = message.senderRole !== "admin";

  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%]",
          mine
            ? "bg-brand-700 text-white"
            : "border border-border bg-white text-brand-900",
        )}
      >
        {message.text ? (
          <p className="text-sm whitespace-pre-line">{message.text}</p>
        ) : null}
        {(message.attachments ?? []).map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block overflow-hidden rounded-xl"
          >
            <Image
              src={url}
              alt="Attachment"
              width={320}
              height={240}
              unoptimized
              className="h-auto w-full max-w-xs object-contain"
            />
          </a>
        ))}
        <p
          className={cn(
            "mt-1.5 text-[0.7rem]",
            mine ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {timestamp(message.createdAt)}
        </p>
      </div>
    </li>
  );
}

/**
 * `/dashboard/support/[id]` — one problem report and its replies.
 *
 * Admin replies arrive over the socket (`problem_report_message` into
 * `user_<owner>`), which is why this thread no longer polls: the reply is
 * appended straight into the `['supportTicket', id]` cache, and a status
 * change just refetches.
 */
export function TicketThread({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const { data: ticket, isPending, isError, error } = useSupportTicket(ticketId);
  const sendMessage = useSendTicketMessage(ticketId);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const messages = [...(ticket?.messages ?? [])].sort(
    (a, b) =>
      new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  useSocketEvent("problem_report_message", (payload) => {
    if (String(payload.reportId) !== String(ticketId)) return;

    const incoming = payload.message;
    if (!incoming) {
      void queryClient.invalidateQueries({ queryKey: ["supportTicket", ticketId] });
      return;
    }

    queryClient.setQueryData<SupportTicket>(["supportTicket", ticketId], (previous) => {
      if (!previous) return previous;
      const existing = previous.messages ?? [];
      // The socket echoes my own send too; dedupe on id, then on text + stamp.
      const duplicate = existing.some((message) =>
        incoming._id
          ? message._id === incoming._id
          : message.text === incoming.text && message.createdAt === incoming.createdAt,
      );
      if (duplicate) return previous;
      return { ...previous, messages: [...existing, incoming] };
    });
  });

  useSocketEvent("problem_report_status_updated", (payload) => {
    if (String(payload.reportId) !== String(ticketId)) return;
    void queryClient.invalidateQueries({ queryKey: ["supportTicket", ticketId] });
  });

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      toast.error("Attachments must be a PNG or JPG image.");
      event.target.value = "";
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error("Attachments must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setFile(picked);
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendMessage.isPending || uploading) return;
    if (!text.trim() && !file) return;

    try {
      let attachments: string[] = [];
      if (file) {
        // Hosted first: the message body only ever carries URLs.
        setUploading(true);
        const uploaded = await supportService.uploadEvidence(file);
        setUploading(false);
        if (uploaded.url) attachments = [uploaded.url];
      }
      await sendMessage.mutateAsync({ text: text.trim(), attachments });
      setText("");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (sendError) {
      setUploading(false);
      toast.error(getApiErrorMessage(sendError, "Could not send your message"));
    }
  }

  if (isPending) {
    return <Skeleton className="h-96 w-full max-w-2xl rounded-2xl" />;
  }

  if (isError || !ticket) {
    return (
      <EmptyState
        icon={MessageSquareWarning}
        title="Report not found"
        description={getApiErrorMessage(error, "We couldn't load this report.")}
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/report?new=1">New report</Link>
          </Button>
        }
      />
    );
  }

  const resolved = ticket.status === "closed";

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-900">
            {ticket.type || "Problem report"}
          </p>
          <p className="text-xs text-muted-foreground">
            Opened {formatDate(ticket.createdAt) ?? "recently"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            resolved ? "bg-muted text-muted-foreground" : "bg-success/10 text-success",
          )}
        >
          {resolved ? "Resolved" : "Open"}
        </span>
      </section>

      <ul aria-live="polite" aria-label="Conversation" className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <Bubble key={message._id ?? `${message.createdAt}-${index}`} message={message} />
        ))}
      </ul>
      <div ref={bottom} />

      {resolved ? (
        <p className="sticky bottom-20 rounded-2xl border border-border bg-white p-4 text-center text-sm text-muted-foreground md:bottom-4">
          This report is resolved. Start a new report if you need more help.
        </p>
      ) : (
        <form
          onSubmit={(event) => void handleSend(event)}
          className="sticky bottom-20 flex flex-col gap-2 rounded-2xl border border-border bg-white p-3 md:bottom-4"
        >
          {file ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {file.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove attachment"
                onClick={() => {
                  setFile(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Attach an image"
              onClick={() => fileInput.current?.click()}
            >
              <ImageUp aria-hidden="true" />
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={handleFile}
            />
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a message…"
              aria-label="Message"
              className="h-11 flex-1"
            />
            <Button
              type="submit"
              size="icon-lg"
              aria-label="Send"
              disabled={sendMessage.isPending || uploading || (!text.trim() && !file)}
            >
              {sendMessage.isPending || uploading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Send aria-hidden="true" />
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

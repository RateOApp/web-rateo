"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageUp, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSendTicketMessage, useSupportTicket } from "@/hooks/use-support";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { supportService } from "@/services/support";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/types/support";
import { MessageSquareWarning } from "lucide-react";

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

/** `/dashboard/support/[id]` — one problem report and its replies. */
export function TicketThread({ ticketId }: { ticketId: string }) {
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

  const open = ticket.status === "open";

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
            open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {open ? "Open" : "Closed"}
        </span>
      </section>

      <ul className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <Bubble key={message._id ?? `${message.createdAt}-${index}`} message={message} />
        ))}
      </ul>
      <div ref={bottom} />

      <form
        onSubmit={handleSend}
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
    </div>
  );
}

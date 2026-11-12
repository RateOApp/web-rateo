import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/types/messages";

const LABELS = { sent: "Sent", delivered: "Delivered", read: "Read" } as const;

/**
 * WhatsApp-style delivery ticks for a message I sent. `bubble` sits on the
 * dark teal outgoing bubble, `list` on the light conversation row.
 */
export function MessageTicks({
  status,
  tone = "list",
  className,
}: {
  status: MessageStatus;
  tone?: "bubble" | "list";
  className?: string;
}) {
  if (status !== "sent" && status !== "delivered" && status !== "read") return null;
  const Icon = status === "sent" ? Check : CheckCheck;
  const color =
    status === "read"
      ? tone === "bubble"
        ? "text-accent-400"
        : "text-brand-700 dark:text-accent-400"
      : tone === "bubble"
        ? "text-white/70"
        : "text-muted-foreground";

  return (
    <span className={cn("inline-flex shrink-0 items-center align-middle", className)}>
      <Icon aria-hidden="true" className={cn("size-3.5", color)} />
      <span className="sr-only">{LABELS[status]}</span>
    </span>
  );
}

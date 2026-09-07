"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Verbatim from `SettingsScreen` (web uses the site link, not a store link). */
export const SHARE_APP_URL = "https://rateo.ng";
export const SHARE_APP_MESSAGE = `Check out Rateo — rate and discover workplaces. Download the app: ${SHARE_APP_URL}`;

/**
 * Settings row that opens the Web Share sheet where there is one, and copies
 * the invite message otherwise.
 */
export function ShareAppButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Rate'O",
          text: SHARE_APP_MESSAGE,
          url: SHARE_APP_URL,
        });
        return;
      } catch (error) {
        // Dismissing the native sheet throws AbortError — not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(SHARE_APP_MESSAGE);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-brand-900 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-5 text-success" />
      ) : (
        <Share2 aria-hidden="true" className="size-5 text-brand-700" />
      )}
      {copied ? "Copied" : "Share App"}
    </button>
  );
}

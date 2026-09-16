"use client";

import { Check, Copy, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MyReferral } from "@/types/referrals";

/**
 * The big code + Copy + Share card.
 *
 * Share uses the Web Share API where there is one and falls back to copying
 * the message, exactly like `ShareAppButton`. `shareMessage` / `shareUrl` come
 * from the backend so the app, the web app and the emails all say the same
 * thing.
 */
export function ReferralCodeCard({
  referral,
  className,
}: {
  referral: MyReferral;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function writeToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) return false;
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCopy() {
    const ok = await writeToClipboard(referral.code);
    setCopyFailed(!ok);
    if (!ok) {
      toast.error("Could not copy the code");
      return;
    }
    setCopied(true);
    toast.success("Code copied");
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Rate'O",
          text: referral.shareMessage,
          url: referral.shareUrl,
        });
        return;
      } catch (error) {
        // Dismissing the native sheet throws AbortError — not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    const ok = await writeToClipboard(referral.shareMessage);
    if (ok) toast.success("Invite link copied");
    else toast.error("Could not copy the invite link");
  }

  return (
    <section className={cn("rounded-2xl border border-border bg-white p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Your invite code
        </h2>
        {referral.isAmbassador ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Ambassador
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-3xl font-bold tracking-[0.25em] break-all text-brand-900 sm:text-4xl">
        {referral.code}
      </p>
      <p className="mt-2 text-xs break-all text-muted-foreground">{referral.shareUrl}</p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 flex-1 gap-2 text-sm font-semibold text-brand-900"
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <Check aria-hidden="true" className="size-4 text-success" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          {copied ? "Copied" : "Copy code"}
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-11 flex-1 gap-2 bg-brand-700 text-sm font-semibold text-white"
          onClick={() => void handleShare()}
        >
          <Share2 aria-hidden="true" className="size-4" />
          Share
        </Button>
      </div>

      {copyFailed ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Copying is blocked in this browser — select the code above and copy it manually.
        </p>
      ) : null}

      {referral.isAmbassador ? (
        <p className="mt-4 rounded-xl bg-accent-50 px-3.5 py-2.5 text-sm text-brand-900">
          Verified referrals are eligible for payout.
        </p>
      ) : null}
    </section>
  );
}

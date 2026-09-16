"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ShareButtonProps = {
  /** Path on this origin, e.g. `/jobs/abc123`. */
  path: string;
  title: string;
  text?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
};

/**
 * Uses the Web Share sheet where the browser has one (mobile, Safari), and
 * falls back to copying the absolute URL. The origin is read at click time so
 * the link is correct on localhost, previews and production alike.
 *
 * Renders alongside a dedicated "Copy link" control - the native share sheet
 * doesn't always offer copy (e.g. desktop Safari), so a copy affordance is
 * always available regardless of `navigator.share` support.
 */
export function ShareButton({
  path,
  title,
  text,
  label = "Share",
  variant = "outline",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // The user dismissing the sheet throws AbortError - not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={variant}
        size="lg"
        className={className}
        onClick={() => void handleShare()}
      >
        {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        {copied ? "Copied" : label}
      </Button>
      <Button
        type="button"
        variant={variant}
        size="lg"
        className={className}
        onClick={() => void handleCopyLink()}
      >
        {linkCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {linkCopied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}

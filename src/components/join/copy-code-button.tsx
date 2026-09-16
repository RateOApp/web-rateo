"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "unavailable";

/**
 * Copies the referral code. The Clipboard API needs a secure context and a
 * user gesture, so when it is missing or refuses we tell the visitor to copy
 * the code by hand instead of failing silently.
 */
export function CopyCodeButton({ code, className }: { code: string; className?: string }) {
  const [state, setState] = useState<CopyState>("idle");

  async function handleCopy() {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setState("unavailable");
        return;
      }
      await navigator.clipboard.writeText(code);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("unavailable");
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Button
        type="button"
        size="lg"
        variant="outline"
        onClick={() => void handleCopy()}
        aria-live="polite"
        className="h-11 w-full gap-2 text-sm font-semibold text-brand-900 sm:w-auto sm:px-6"
      >
        {state === "copied" ? (
          <Check aria-hidden="true" className="size-4 text-success" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        {state === "copied" ? "Copied" : "Copy code"}
      </Button>

      {state === "unavailable" ? (
        <p role="status" className="text-xs text-muted-foreground">
          Copying is blocked in this browser — write the code down instead.
        </p>
      ) : null}
    </div>
  );
}

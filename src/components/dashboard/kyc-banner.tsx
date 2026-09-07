"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KycStatus } from "@/types/api";

/**
 * Home-screen KYC nudge. `pending` is informational; anything else unverified
 * links to the KYC flow. A missing status means "not loaded yet" - the banner
 * stays hidden rather than flashing "get verified" at a verified user.
 */
export function KycBanner({
  status,
  className,
}: {
  status: KycStatus | undefined;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!status || status === "verified" || dismissed) return null;

  const pending = status === "pending";
  const title = pending ? "Verification pending" : "Complete KYC to get verified";
  const subtitle = pending
    ? "This usually takes 24 hours"
    : "Boost your credibility with a verified badge. Tap to start.";

  const body = (
    <>
      <p className="text-sm font-bold text-brand-900">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </>
  );

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl p-4",
        pending ? "bg-accent-50" : "bg-danger/10",
        className,
      )}
    >
      {pending ? (
        <div className="min-w-0 flex-1">{body}</div>
      ) : (
        <Link
          href="/dashboard/kyc"
          className="min-w-0 flex-1 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {body}
        </Link>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

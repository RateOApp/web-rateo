"use client";

import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { participationBannerCopy } from "@/lib/participation";
import { isWithinRatingWindow } from "@/lib/rating-window";
import { cn } from "@/lib/utils";
import type { ParticipationStatus } from "@/types/api";

type ParticipationBannerProps = {
  status: ParticipationStatus | null | undefined;
  /** Ratings still owed this window. The banner hides at 0. */
  outstanding: number | null | undefined;
  className?: string;
};

/**
 * The monthly nudge. Only shown inside the rating window (1st-10th) while the
 * user still owes a rating - both conditions live here so every caller gets
 * them right. Copy per status comes from `participationBannerCopy`.
 */
export function ParticipationBanner({
  status,
  outstanding,
  className,
}: ParticipationBannerProps) {
  if (!outstanding || outstanding <= 0) return null;
  if (!isWithinRatingWindow()) return null;

  const overdue = status === "overdue";

  return (
    <Link
      href="/dashboard/ratings"
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        overdue
          ? "border-danger/30 bg-danger/10 text-danger hover:bg-danger/15"
          : "border-accent-400 bg-accent-50 text-accent-600 hover:bg-cream-100",
        className,
      )}
    >
      <Star aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">{participationBannerCopy(status)}</span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  );
}

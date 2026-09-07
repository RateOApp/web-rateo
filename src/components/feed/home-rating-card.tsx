"use client";

import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { FeedbackCard } from "@/components/dashboard/feedback-card";
import { ParticipationChip } from "@/components/dashboard/participation-chip";
import { ParticipationRing } from "@/components/dashboard/participation-ring";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParticipationStatus } from "@/hooks/use-participation";
import { useUserReviews } from "@/hooks/use-reviews";
import { PARTICIPATION_INFO, participationSubtitle } from "@/lib/participation";

/**
 * Home's "Overall rating" card: the star average with its tiered copy on top,
 * the participation score with its own subtitle below. Both halves link to
 * `/dashboard/ratings`; the info tooltip stays outside the link so the anchor
 * never wraps a button.
 */
export function HomeRatingCard({ userId }: { userId: string }) {
  const reviews = useUserReviews(userId);
  const participation = useParticipationStatus();

  const average =
    typeof reviews.data?.averageRating === "number" ? reviews.data.averageRating : null;
  const total = reviews.data?.totalReviews ?? 0;

  const status = participation.data?.participationStatus ?? null;
  const score =
    typeof participation.data?.participationScore === "number"
      ? participation.data.participationScore
      : null;

  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <Link
        href="/dashboard/ratings"
        className="flex items-center gap-3 rounded-xl transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <FeedbackCard
          average={average}
          total={total}
          loading={reviews.isLoading}
          className="min-w-0 flex-1"
        />
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      </Link>

      <hr className="my-4 border-border" />

      <div className="flex items-center gap-4">
        {participation.isLoading && !participation.data ? (
          <Skeleton className="size-11 shrink-0 rounded-full" />
        ) : (
          <ParticipationRing score={score} status={status} percent className="shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-brand-900">Participation score</p>
            <Tooltip>
              <TooltipTrigger
                aria-label="About the participation score"
                className="rounded-full text-muted-foreground transition-colors hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Info aria-hidden="true" className="size-4" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{PARTICIPATION_INFO}</TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {participationSubtitle(score, status)}
          </p>
        </div>

        <ParticipationChip score={score} status={status} className="shrink-0" />
      </div>
    </section>
  );
}

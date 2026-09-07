"use client";

import { Lock } from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import {
  HIDDEN_CURRENT_EMPLOYEE,
  HIDDEN_PARTICIPATION,
  HIDDEN_STILL_EMPLOYED,
  splitComment,
} from "@/components/ratings/review-detail-dialog";
import { formatDate } from "@/lib/format";
import type { ReviewItem } from "@/types/reviews";

const EXCERPT_LENGTH = 150;

/** Reviewer label used on the "My Rating" tab. */
function reviewerName(review: ReviewItem): string {
  const reviewer = review.reviewer;
  const person = [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(" ").trim();
  return reviewer?.companyName?.trim() || person || "Company";
}

type ReviewCardProps = {
  review: ReviewItem;
  /**
   * `about-me` — written about the signed-in user (heading = the reviewer).
   * `about-company` — written about their employer (heading = review title).
   */
  variant: "about-me" | "about-company";
  onOpen?: (review: ReviewItem) => void;
};

export function ReviewCard({ review, variant, onOpen }: ReviewCardProps) {
  const date = formatDate(review.createdAt);
  const { title } = splitComment(review.comment);
  const heading = variant === "about-me" ? reviewerName(review) : title || "Review";

  const hiddenCopy = review.commentHidden
    ? HIDDEN_PARTICIPATION
    : review.isCurrentEmployee
      ? variant === "about-me"
        ? HIDDEN_CURRENT_EMPLOYEE
        : HIDDEN_STILL_EMPLOYED
      : null;

  const comment = review.comment ?? "";
  const truncated = comment.length > EXCERPT_LENGTH;

  return (
    <article className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-brand-900">{heading}</h3>
        {date ? <span className="text-xs text-muted-foreground">{date}</span> : null}
      </div>

      {/* Mobile keeps the stars visible on a hidden review when the card is
          about the signed-in user; the company tab hides the whole row. */}
      {variant === "about-me" || !hiddenCopy ? (
        <StarRating className="mt-2" value={review.rating ?? 0} size={18} />
      ) : null}

      {hiddenCopy ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {hiddenCopy}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {truncated ? `${comment.slice(0, EXCERPT_LENGTH)}…` : comment}
            {truncated ? (
              <button
                type="button"
                onClick={() => onOpen?.(review)}
                className="ml-1 font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Read more...
              </button>
            ) : null}
          </p>
        </>
      )}
    </article>
  );
}

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

/**
 * Whose reviews these are, which decides three things at once: what the heading
 * says, what a sealed review is allowed to reveal, and which sentence explains
 * the seal.
 *
 * - `about-me` — written about the signed-in individual. The employer's name is
 *   the heading, and a sealed review still shows its stars: the score already
 *   counts towards the average, only the words are held back.
 * - `about-company` — the employer's public reviews, seen by an employee.
 * - `about-my-company` — the company reading its OWN reviews. A sealed one
 *   shows nothing at all: not the reviewer, not the stars. Staff write these
 *   precisely because they stay anonymous until the contract ends, and a name
 *   next to a lock icon would break that promise while looking like it kept it.
 */
type ReviewVariant = "about-me" | "about-company" | "about-my-company";

const VARIANTS: Record<
  ReviewVariant,
  {
    /** Heading source: the reviewer, or the review's own title. */
    heading: "reviewer" | "title";
    /** Name for a reviewer the payload did not populate. */
    fallbackName: string;
    /** Copy for a review by someone still employed. */
    hiddenEmployeeCopy: string;
    /** Whether a sealed review may still show its score. */
    starsWhenHidden: boolean;
    /** Heading for a sealed review; `null` keeps the normal one. */
    hiddenHeading: string | null;
  }
> = {
  "about-me": {
    heading: "reviewer",
    fallbackName: "Company",
    hiddenEmployeeCopy: HIDDEN_CURRENT_EMPLOYEE,
    starsWhenHidden: true,
    hiddenHeading: null,
  },
  "about-company": {
    heading: "title",
    fallbackName: "Company",
    hiddenEmployeeCopy: HIDDEN_STILL_EMPLOYED,
    starsWhenHidden: false,
    hiddenHeading: null,
  },
  "about-my-company": {
    heading: "reviewer",
    fallbackName: "User",
    hiddenEmployeeCopy: HIDDEN_STILL_EMPLOYED,
    starsWhenHidden: false,
    hiddenHeading: "Review Hidden",
  },
};

function reviewerName(review: ReviewItem, fallback: string): string {
  const reviewer = review.reviewer;
  const person = [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(" ").trim();
  return reviewer?.companyName?.trim() || person || fallback;
}

type ReviewCardProps = {
  review: ReviewItem;
  variant: ReviewVariant;
  onOpen?: (review: ReviewItem) => void;
};

export function ReviewCard({ review, variant, onOpen }: ReviewCardProps) {
  const config = VARIANTS[variant];
  const date = formatDate(review.createdAt);
  const { title } = splitComment(review.comment);

  const hiddenCopy = review.commentHidden
    ? HIDDEN_PARTICIPATION
    : review.isCurrentEmployee
      ? config.hiddenEmployeeCopy
      : null;

  const heading =
    hiddenCopy && config.hiddenHeading
      ? config.hiddenHeading
      : config.heading === "reviewer"
        ? reviewerName(review, config.fallbackName)
        : title || "Review";

  const comment = review.comment ?? "";
  const truncated = comment.length > EXCERPT_LENGTH;

  return (
    <article className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-brand-900">{heading}</h3>
        {date ? <span className="text-xs text-muted-foreground">{date}</span> : null}
      </div>

      {!hiddenCopy || config.starsWhenHidden ? (
        <StarRating className="mt-2" value={review.rating ?? 0} size={18} />
      ) : null}

      {hiddenCopy ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {hiddenCopy}
        </p>
      ) : (
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
      )}
    </article>
  );
}

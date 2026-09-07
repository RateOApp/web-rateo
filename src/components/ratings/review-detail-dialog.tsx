"use client";

import { Lock } from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import type { ReviewItem } from "@/types/reviews";

/**
 * Comments are stored as `"title\n\nbody"` by both rating flows. A single
 * paragraph becomes the title with no body, matching the mobile screens.
 */
export function splitComment(comment: string | null | undefined): {
  title: string;
  body: string;
} {
  const parts = (comment ?? "").split(/\n\s*\n/);
  return {
    title: parts[0]?.trim() ?? "",
    body: parts.slice(1).join("\n\n").trim(),
  };
}

/** Copy shown instead of a comment, in the order mobile checks the flags. */
export const HIDDEN_PARTICIPATION =
  "Feedback hidden — this user hasn't completed their monthly rating.";
export const HIDDEN_CURRENT_EMPLOYEE =
  "Review hidden — revealed when the contract ends.";
export const HIDDEN_STILL_EMPLOYED =
  "Still an employee — rating cannot be seen until after termination of contract.";

type ReviewDetailDialogProps = {
  review: ReviewItem | null;
  onOpenChange: (open: boolean) => void;
  /** Company tab hides a still-employed reviewer's comment with other copy. */
  hiddenEmployeeCopy?: string;
};

export function ReviewDetailDialog({
  review,
  onOpenChange,
  hiddenEmployeeCopy = HIDDEN_CURRENT_EMPLOYEE,
}: ReviewDetailDialogProps) {
  const { title, body } = splitComment(review?.comment);
  const date = formatDate(review?.createdAt);
  const hiddenCopy = review?.commentHidden
    ? HIDDEN_PARTICIPATION
    : review?.isCurrentEmployee
      ? hiddenEmployeeCopy
      : null;

  return (
    <Dialog open={Boolean(review)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {review?.commentHidden
              ? "Feedback hidden"
              : review?.isCurrentEmployee
                ? "Review hidden"
                : title || "Review"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <StarRating value={review?.rating ?? 0} size={18} />
          {date ? <span className="text-xs text-muted-foreground">{date}</span> : null}
        </div>

        {hiddenCopy ? (
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
            <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {hiddenCopy}
          </p>
        ) : (
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {body || title || "No comment left."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

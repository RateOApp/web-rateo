"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommentStep } from "@/components/ratings/comment-step";
import { CriterionStep } from "@/components/ratings/criterion-step";
import { RatingSuccess } from "@/components/ratings/rating-success";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from "@/lib/rating-window";
import { cn } from "@/lib/utils";
import { reviewsService } from "@/services/reviews";
import type { CreateReviewPayload } from "@/types/reviews";

type Scores = Record<string, number>;

export type RatingFlowProps = {
  /** The 1-5 steps, in display order. A "Comment" step is appended. */
  criteria: readonly string[];
  /** Who is being rated. */
  targetId: string;
  /** Shown above the steps; omit for the generic line. */
  targetName?: string | null;
  category: CreateReviewPayload["category"];
  /**
   * The question without the criterion or the "?", e.g.
   * "What would you rate this employee in terms of".
   */
  question: string;
  /** Where "Go back" leads after a successful submit. */
  successHref: string;
  /** Where the back arrow leads from the first step. Defaults to `successHref`. */
  backHref?: string;
  /** Query keys to invalidate once the review is in. */
  invalidate: readonly (readonly unknown[])[];
};

/**
 * The shared rating wizard: N criteria at 1-5, then a title + comment, then a
 * single `POST /reviews`.
 *
 * Both directions of Rate'O run through this - an employee rating their
 * employer and a company rating an employee - because the steps, the payload
 * and the monthly window are identical; only the criteria, the subject of the
 * question and the redirect differ. The gates that decide whether the flow may
 * be entered at all (current employer, `ratingRequired`, monthly status) belong
 * to the caller: they are asymmetric, and this component must stay a wizard
 * rather than grow a second personality.
 *
 * The window is re-checked at submit, not just on mount: the 10th can tick over
 * while the form is open, and the server would reject it anyway.
 */
export function RatingFlow({
  criteria,
  targetId,
  targetName,
  category,
  question,
  successHref,
  backHref,
  invalidate,
}: RatingFlowProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [scores, setScores] = useState<Scores>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const steps = [...criteria, "Comment"];

  const submit = useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsService.create(payload),
    onSuccess: () => {
      for (const key of invalidate) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      router.refresh();
      setDone(true);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Could not submit your rating"));
    },
  });

  if (done) return <RatingSuccess href={successHref} />;

  const criterion = steps[step - 1];
  const isComment = criterion === "Comment";
  const canProceed = isComment
    ? title.trim().length > 0 && body.trim().length > 0
    : (scores[criterion] ?? 0) > 0;

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    router.push(backHref ?? successHref);
  }

  function handleNext() {
    if (!canProceed) {
      if (isComment) {
        toast.error("Title and comment required", {
          description:
            "Your written review is the core of Rateo — please add a title and a comment before submitting.",
        });
      } else {
        toast.error("Pick a rating", {
          description: `Please select a rating for ${criterion} to continue.`,
        });
      }
      return;
    }

    if (step < steps.length) {
      setStep((current) => current + 1);
      return;
    }

    if (!isWithinRatingWindow()) {
      toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
      return;
    }

    const values = criteria.map((label) => scores[label] ?? 0);
    const average =
      Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;

    submit.mutate({
      targetId,
      rating: average,
      details: Object.fromEntries(criteria.map((label) => [label, scores[label] ?? 0])),
      comment: `${title.trim()}\n\n${body.trim()}`,
      category,
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-8">
      {/* Progress: filled = current, solid dot = done, ring = still to come. */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((label, index) => {
          const position = index + 1;
          if (position === step) {
            return (
              <span
                key={label}
                aria-current="step"
                className="flex size-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white"
              >
                {position}
              </span>
            );
          }
          return (
            <span
              key={label}
              aria-hidden="true"
              className={cn(
                "size-2.5 rounded-full",
                position < step ? "bg-brand-700" : "bg-muted",
              )}
            />
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {targetName?.trim()
          ? `Rating: ${targetName.trim()}`
          : category === "employee_review"
            ? "Rating your employee"
            : "Rating your employer"}
      </p>

      <div className="mt-8">
        {isComment ? (
          <CommentStep
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
          />
        ) : (
          <CriterionStep
            criterion={criterion}
            question={question}
            value={scores[criterion] ?? 0}
            onChange={(value) => setScores((current) => ({ ...current, [criterion]: value }))}
          />
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={handleBack}
          disabled={submit.isPending}
          aria-label={step > 1 ? "Previous step" : "Back"}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleNext}
          disabled={submit.isPending}
          aria-label={step < steps.length ? "Next step" : "Submit rating"}
          className="h-11 min-w-32 gap-2 font-semibold"
        >
          {submit.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {step < steps.length ? "Continue" : "Submit"}
          {step < steps.length ? <ChevronRight aria-hidden="true" /> : null}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommentStep } from "@/components/ratings/comment-step";
import { CriterionStep } from "@/components/ratings/criterion-step";
import { RatingSuccess } from "@/components/ratings/rating-success";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { useMonthlyPrompt } from "@/hooks/use-reviews";
import { getApiErrorMessage } from "@/lib/api/client";
import { COMPANY_CRITERIA } from "@/lib/rating-criteria";
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from "@/lib/rating-window";
import { cn } from "@/lib/utils";
import { companiesService } from "@/services/companies";
import { reviewsService } from "@/services/reviews";
import type { CreateReviewPayload } from "@/types/reviews";
import { Building2 } from "lucide-react";

const STEPS = [...COMPANY_CRITERIA, "Comment"] as const;

type Scores = Record<string, number>;

const EMPTY_SCORES: Scores = Object.fromEntries(
  COMPANY_CRITERIA.map((criterion) => [criterion, 0]),
);

/** `/dashboard/ratings/rate` — an individual rating their current employer. */
export function RatingFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [scores, setScores] = useState<Scores>(EMPTY_SCORES);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const { data: me, isPending: mePending } = useMe();
  const employer = me?.experience?.find((entry) => entry.current && entry.companyId);
  const companyId = employer?.companyId;

  const inWindow = isWithinRatingWindow();
  const bounced = useRef(false);

  const company = useQuery({
    queryKey: ["company", companyId ?? ""] as const,
    queryFn: () => companiesService.byId(companyId as string),
    enabled: Boolean(companyId) && inWindow,
    staleTime: 5 * 60 * 1000,
  });

  const monthly = useMonthlyPrompt(inWindow);

  // Door check 1: outside the window nothing can be submitted at all.
  useEffect(() => {
    if (inWindow || bounced.current) return;
    bounced.current = true;
    toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
    router.replace("/dashboard/ratings");
  }, [inWindow, router]);

  // Door check 2: `shouldPrompt === false` with no window/employer reason means
  // this month's rating is already in. Mirrors CompanyRatingFlowScreen.
  useEffect(() => {
    const status = monthly.data;
    if (!status || bounced.current) return;
    if (
      status.shouldPrompt === false &&
      status.reason !== "no_current_employer" &&
      status.reason !== "outside_rating_window"
    ) {
      bounced.current = true;
      toast.info("Already rated", {
        description: "You have already rated your company this month.",
      });
      router.replace("/dashboard/ratings");
    }
  }, [monthly.data, router]);

  const submit = useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsService.create(payload),
    onSuccess: () => {
      for (const key of [
        ["userReviews"],
        ["companyRatings"],
        ["participationStatus"],
        ["monthlyPrompt"],
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      setDone(true);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Could not submit your rating"));
    },
  });

  if (done) {
    return (
      <PageContainer className="max-w-xl">
        <RatingSuccess />
      </PageContainer>
    );
  }

  if (mePending || (inWindow && monthly.isPending)) {
    return (
      <PageContainer className="max-w-xl">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  if (!companyId) {
    return (
      <PageContainer className="max-w-xl">
        <EmptyState
          icon={Building2}
          title="You do not work for any company yet"
          description="Join your company on Rateo first — once they confirm you, you can rate them every month."
          action={
            <Button asChild size="lg">
              <Link href="/dashboard/request-company">Request to join a company</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const criterion = STEPS[step - 1];
  const isComment = criterion === "Comment";
  const canProceed = isComment
    ? title.trim().length > 0 && body.trim().length > 0
    : (scores[criterion] ?? 0) > 0;

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    router.push("/dashboard/ratings");
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

    if (step < STEPS.length) {
      setStep((current) => current + 1);
      return;
    }

    if (!isWithinRatingWindow()) {
      toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
      return;
    }

    const values = COMPANY_CRITERIA.map((label) => scores[label] ?? 0);
    const average =
      Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) /
      100;

    submit.mutate({
      targetId: companyId as string,
      rating: average,
      details: Object.fromEntries(COMPANY_CRITERIA.map((l) => [l, scores[l] ?? 0])),
      comment: `${title.trim()}\n\n${body.trim()}`,
      category: "company_review",
    });
  }

  const companyName = company.data?.companyName?.trim();

  return (
    <PageContainer className="max-w-xl">
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-8">
        {/* Progress: filled = current, solid dot = done, ring = still to come. */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((label, index) => {
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
                  "rounded-full",
                  position < step ? "size-2.5 bg-brand-700" : "size-2.5 bg-muted",
                )}
              />
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {companyName ? `Rating: ${companyName}` : "Rating your employer"}
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
              value={scores[criterion] ?? 0}
              onChange={(value) =>
                setScores((current) => ({ ...current, [criterion]: value }))
              }
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
            aria-label={step > 1 ? "Previous step" : "Back to ratings"}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={handleNext}
            disabled={submit.isPending}
            aria-label={step < STEPS.length ? "Next step" : "Submit rating"}
            className="h-11 min-w-32 gap-2 font-semibold"
          >
            {submit.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {step < STEPS.length ? "Continue" : "Submit"}
            {step < STEPS.length ? <ChevronRight aria-hidden="true" /> : null}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

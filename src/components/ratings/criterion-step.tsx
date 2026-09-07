"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { CriterionInfoDialog } from "@/components/ratings/criterion-info-dialog";
import { getCriterionInfo } from "@/lib/rating-criteria";
import { cn } from "@/lib/utils";

type CriterionStepProps = {
  criterion: string;
  /** 0 when nothing is picked yet. */
  value: number;
  onChange: (value: number) => void;
};

/** One of the five 1-5 score steps of the rating flow. */
export function CriterionStep({ criterion, value, onChange }: CriterionStepProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const info = getCriterionInfo(criterion);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">
        What would you rate your company in terms of{" "}
        <span className="text-accent-600">{criterion}</span>?
        {info ? (
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label={`What ${criterion} means`}
            className="ml-1.5 inline-flex translate-y-0.5 rounded-full text-accent-600 transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Info aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </h2>

      <div>
        <div
          role="radiogroup"
          aria-label={`${criterion} rating`}
          className="flex items-center justify-between gap-2 sm:gap-3"
        >
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              onClick={() => onChange(score)}
              className={cn(
                "flex size-14 flex-1 items-center justify-center rounded-2xl border text-lg font-bold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:size-16 sm:text-xl",
                value === score
                  ? "border-transparent bg-brand-700 text-white"
                  : "border-border bg-white text-brand-900 hover:bg-brand-50",
              )}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>

      <CriterionInfoDialog
        criterion={criterion}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </div>
  );
}

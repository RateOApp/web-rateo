"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { CriterionInfoDialog } from "@/components/ratings/criterion-info-dialog";
import { canonicalCriterion } from "@/lib/rating";
import { getCriterionInfo } from "@/lib/rating-criteria";
import { cn } from "@/lib/utils";

export type MetricRow = { label: string; value: number };

/**
 * Builds one row per criterion from a `detailsBreakdown` map, folding legacy
 * keys onto their current labels. Criteria the target has never been scored on
 * render as an empty bar (0), exactly like the mobile screen.
 */
export function metricsFromBreakdown(
  criteria: readonly string[],
  breakdown: Record<string, number> | undefined,
): MetricRow[] {
  const folded = new Map<string, number>();
  for (const [rawLabel, rawValue] of Object.entries(breakdown ?? {})) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) continue;
    folded.set(canonicalCriterion(rawLabel), value);
  }
  return criteria.map((label) => ({ label, value: folded.get(label) ?? 0 }));
}

/** True when at least one criterion has actually been scored. */
export function hasAnyMetric(rows: MetricRow[]): boolean {
  return rows.some((row) => row.value > 0);
}

function SegmentBar({ value }: { value: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, value)));

  return (
    <span
      aria-hidden="true"
      className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5"
    >
      {[1, 2, 3, 4, 5].map((segment) => (
        <span
          key={segment}
          className={cn(
            "h-2 flex-1 rounded-full",
            segment <= filled ? "bg-star" : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

type MetricsBarsProps = {
  rows: MetricRow[];
  /** Rendered instead of the bars when every criterion is unscored. */
  emptyLabel?: string;
  className?: string;
};

/**
 * The five-segment criterion bars from `IndividualRatingsScreen`. Each label
 * with an entry in `RATING_CRITERIA_INFO` gets an ⓘ button.
 */
export function MetricsBars({ rows, emptyLabel, className }: MetricsBarsProps) {
  const [openCriterion, setOpenCriterion] = useState<string | null>(null);

  if (emptyLabel && !hasAnyMetric(rows)) {
    return (
      <section
        className={cn("rounded-2xl border border-border bg-white p-5", className)}
      >
        <p className="text-center text-sm text-muted-foreground">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6",
        className,
      )}
    >
      {rows.map((row) => {
        const info = getCriterionInfo(row.label);
        return (
          <div key={row.label} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-start gap-1 sm:w-40">
              <span className="text-[0.8125rem] leading-tight font-medium text-brand-900 sm:text-sm">
                {row.label}
              </span>
              {info ? (
                <button
                  type="button"
                  onClick={() => setOpenCriterion(row.label)}
                  aria-label={`What ${row.label} means`}
                  className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Info aria-hidden="true" className="mt-0.5 size-3.5" />
                </button>
              ) : null}
            </span>
            <SegmentBar value={row.value} />
            <span className="w-6 shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums">
              {row.value > 0 ? row.value.toFixed(1) : "—"}
            </span>
          </div>
        );
      })}

      <CriterionInfoDialog
        criterion={openCriterion}
        open={Boolean(openCriterion)}
        onOpenChange={(next) => {
          if (!next) setOpenCriterion(null);
        }}
      />
    </section>
  );
}

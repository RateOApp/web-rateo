import { StarRating } from "@/components/shared/star-rating";
import {
  averageRating,
  criteriaAverages,
  formatRating,
  ratingDistribution,
} from "@/lib/rating";
import type { ContractEndSummary, Review } from "@/types/api";

/** A horizontal 0–1 progress bar in the star colour. */
function Bar({ fraction }: { fraction: number }) {
  const width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  return (
    // `w-full`, not `flex-1`: inside a column flex parent `flex-1` collapses the
    // height to zero. Horizontal rows wrap this in their own `flex-1` element.
    <span aria-hidden="true" className="block h-2 w-full overflow-hidden rounded-full bg-muted">
      <span className="block h-full rounded-full bg-star" style={{ width }} />
    </span>
  );
}

function Distribution({ reviews }: { reviews: Review[] }) {
  const rows = ratingDistribution(reviews);
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.stars} className="flex items-center gap-2">
          <span className="w-8 shrink-0 text-xs text-muted-foreground">{row.stars} ★</span>
          <span className="min-w-0 flex-1">
            <Bar fraction={row.count / max} />
          </span>
          <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function Criteria({ reviews }: { reviews: Review[] }) {
  const rows = criteriaAverages(reviews);
  if (!rows.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-brand-900">What people rate</h3>
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium text-brand-900">
              {formatRating(row.average)}
            </span>
          </div>
          <Bar fraction={row.average / 5} />
        </div>
      ))}
    </div>
  );
}

/**
 * "How this employer ends contracts" — only shown once at least one employment
 * has actually ended, so a brand-new company is not labelled either way.
 */
function ContractEnds({ summary }: { summary: ContractEndSummary }) {
  const notice = summary.noticeCount ?? 0;
  const immediate = summary.immediateCount ?? 0;
  const total = notice + immediate;
  if (total < 1) return null;

  const noticePct = Math.round((notice / total) * 100);
  const immediatePct = 100 - noticePct;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-4">
      <h3 className="text-sm font-semibold text-brand-900">How this employer ends contracts</h3>
      <span aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-muted">
        <span className="block h-full bg-success" style={{ width: `${noticePct}%` }} />
        <span className="block h-full bg-accent-600" style={{ width: `${immediatePct}%` }} />
      </span>
      <p className="text-xs text-muted-foreground">
        {noticePct}% left with notice / {immediatePct}% ended immediately ({total}{" "}
        {total === 1 ? "ending" : "endings"})
      </p>
    </div>
  );
}

export function RatingSummary({
  reviews,
  contractEndSummary,
}: {
  reviews: Review[];
  contractEndSummary?: ContractEndSummary;
}) {
  const average = averageRating(reviews);
  const count = reviews.length;

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-brand-900">Ratings</h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-1 sm:w-40">
          <p className="text-4xl font-bold text-brand-900">{formatRating(average)}</p>
          <StarRating value={average} size={18} />
          <p className="text-xs text-muted-foreground">
            {count} {count === 1 ? "rating" : "ratings"}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <Distribution reviews={reviews} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Criteria reviews={reviews} />
        {contractEndSummary ? <ContractEnds summary={contractEndSummary} /> : null}
      </div>
    </section>
  );
}

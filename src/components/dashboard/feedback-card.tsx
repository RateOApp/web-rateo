import { formatRating } from "@/lib/rating";
import { ratingFeedback } from "@/lib/rating-feedback";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type FeedbackCardProps = {
  average: number | null;
  total: number;
  loading?: boolean;
  className?: string;
};

/**
 * Average rating in a circle plus the tiered feedback copy. Shared by home
 * (inside `HomeRatingCard`), the profile header and the ratings tab, so the
 * same average always reads the same way.
 */
export function FeedbackCard({
  average,
  total,
  loading = false,
  className,
}: FeedbackCardProps) {
  const { title, subtitle } = ratingFeedback(average, total);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cream-50 text-xl font-bold text-brand-900 tabular-nums">
        {loading && average === null ? (
          <Skeleton className="h-6 w-8" />
        ) : (
          formatRating(average)
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-brand-900">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

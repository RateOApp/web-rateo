import { Star } from "lucide-react";
import { ParticipationChip } from "@/components/dashboard/participation-chip";
import { NOT_ESTABLISHED_LABEL, participationTier } from "@/lib/participation";
import { formatRating, hasRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import type { ParticipationStatus } from "@/types/api";

type ParticipationStatCardProps = {
  rating: number | null;
  score: number | null;
  status: ParticipationStatus | null;
  className?: string;
};

/**
 * The two-column "Overall rating | Participation score" card used on profiles
 * and the ratings tab. Deliberately dumb: pass the three numbers, nothing else.
 */
export function ParticipationStatCard({
  rating,
  score,
  status,
  className,
}: ParticipationStatCardProps) {
  const tier = participationTier(score, status);

  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-x divide-border rounded-2xl border border-border bg-white",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1 p-4 text-center">
        <p className="text-xs font-medium text-muted-foreground">Overall rating</p>
        <p className="flex items-center gap-1 text-2xl font-bold text-brand-900">
          {formatRating(rating)}
          <Star aria-hidden="true" className="size-4 fill-star text-star" />
        </p>
        {!hasRating(rating) ? (
          <p className="text-xs text-muted-foreground">No ratings yet</p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-1 p-4 text-center">
        <p className="text-xs font-medium text-muted-foreground">Participation score</p>
        <p className="text-2xl font-bold tabular-nums text-brand-900">
          {tier.hasScore ? `${score}%` : "—"}
        </p>
        {tier.hasScore ? (
          <ParticipationChip score={score} status={status} />
        ) : (
          <p className="text-xs text-muted-foreground">{NOT_ESTABLISHED_LABEL}</p>
        )}
      </div>
    </div>
  );
}

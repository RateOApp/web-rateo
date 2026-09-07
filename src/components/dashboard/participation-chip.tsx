import {
  NOT_ESTABLISHED_LABEL,
  PARTICIPATION_TONE_CLASSES,
  participationTier,
} from "@/lib/participation";
import { cn } from "@/lib/utils";
import type { ParticipationStatus } from "@/types/api";

type ParticipationChipProps = {
  score: number | null | undefined;
  status: ParticipationStatus | null | undefined;
  /** Show "Not yet established" instead of nothing when there is no score. */
  showNotEstablished?: boolean;
  className?: string;
};

/** Overdue / Excellent / Good / Low pill. Renders nothing without a score. */
export function ParticipationChip({
  score,
  status,
  showNotEstablished = false,
  className,
}: ParticipationChipProps) {
  const tier = participationTier(score, status);

  if (!tier.chip) {
    if (!showNotEstablished) return null;
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {NOT_ESTABLISHED_LABEL}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        PARTICIPATION_TONE_CLASSES[tier.tone].chip,
        className,
      )}
    >
      {tier.chip.label}
    </span>
  );
}

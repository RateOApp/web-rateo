import {
  PARTICIPATION_TONE_CLASSES,
  participationTier,
} from "@/lib/participation";
import { cn } from "@/lib/utils";
import type { ParticipationStatus } from "@/types/api";

type ParticipationRingProps = {
  score: number | null | undefined;
  status: ParticipationStatus | null | undefined;
  /** Diameter in px. */
  size?: number;
  /** Render "82%" instead of "82". */
  percent?: boolean;
  /** Caption under the ring, e.g. "Ptn.". */
  caption?: string;
  className?: string;
};

/**
 * The participation score in a tinted ring. Tone comes from
 * `participationTier` so the ring, the chip and the stat card can never
 * disagree. No score yet (`not_established`) shows a grey em dash.
 */
export function ParticipationRing({
  score,
  status,
  size = 44,
  percent = false,
  caption,
  className,
}: ParticipationRingProps) {
  const tier = participationTier(score, status);
  const tone = PARTICIPATION_TONE_CLASSES[tier.tone];
  const label = tier.hasScore ? `${score}${percent ? "%" : ""}` : "—";

  return (
    <span className={cn("inline-flex flex-col items-center gap-0.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border-[3px] bg-white font-bold tabular-nums",
          tone.ring,
          tone.text,
        )}
        style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.3)) }}
      >
        {label}
      </span>
      {caption ? (
        <span className={cn("text-[10px] font-bold", tone.text)}>{caption}</span>
      ) : null}
    </span>
  );
}

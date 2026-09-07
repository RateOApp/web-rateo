import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  /** 0–5; rounded to the nearest half star. */
  value: number;
  /** Icon size in px. */
  size?: number;
  /** Optional trailing label, e.g. "4.5" or "(12)". */
  label?: string;
  className?: string;
};

const MAX = 5;

/** Read-only star rating with half-star precision. Uses the `star` token. */
export function StarRating({
  value,
  size = 16,
  label,
  className,
}: StarRatingProps) {
  const clamped = Math.min(MAX, Math.max(0, Number.isFinite(value) ? value : 0));
  const rounded = Math.round(clamped * 2) / 2;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={`${rounded} out of ${MAX} stars`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: MAX }, (_, i) => {
          const fill = Math.min(1, Math.max(0, rounded - i));
          return (
            <span
              key={i}
              className="relative inline-block shrink-0"
              style={{ width: size, height: size }}
            >
              <Star
                className="absolute inset-0 text-gray-400/50"
                style={{ width: size, height: size }}
              />
              {fill > 0 ? (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className="fill-star text-star"
                    style={{ width: size, height: size }}
                  />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {label ? (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      ) : null}
    </span>
  );
}

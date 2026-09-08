"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Minimum applicant rating. Tapping the active star clears the filter back to
 * 0, exactly like the mobile picker - `0` means "no minimum".
 */
export function RatingPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {STARS.map((star) => {
          const filled = star <= value;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              aria-pressed={filled}
              aria-label={`${star} star${star === 1 ? "" : "s"} minimum`}
              onClick={() => onChange(star === value ? 0 : star)}
              className="rounded p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <Star
                aria-hidden="true"
                className={cn("size-7", filled ? "fill-star text-star" : "text-gray-400/60")}
              />
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {value > 0 ? `${value}+ stars` : "No minimum — any rating can apply"}
      </p>
    </div>
  );
}

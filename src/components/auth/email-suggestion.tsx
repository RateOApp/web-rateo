"use client";

import { cn } from "@/lib/utils";

/** Non-blocking "Did you mean …?" hint; the whole line accepts the suggestion. */
export function EmailSuggestion({
  suggestion,
  onAccept,
  className,
}: {
  suggestion: string | null;
  onAccept: () => void;
  className?: string;
}) {
  if (!suggestion) return null;
  return (
    <button
      type="button"
      onClick={onAccept}
      aria-label={`Use ${suggestion}`}
      className={cn("mt-1 text-left text-sm text-muted-foreground", className)}
    >
      Did you mean <span className="font-semibold text-accent-600">{suggestion}</span>?
    </button>
  );
}

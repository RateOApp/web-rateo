"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthlyPrompt } from "@/hooks/use-reviews";
import { ratingWindowLabel, isWithinRatingWindow } from "@/lib/rating-window";
import type { User } from "@/types/api";

/** Key mirrors app-rateo's AsyncStorage key so the cadence matches. */
function seenKey(userId: string): string {
  return `ratingPromptSeen-${userId}-${new Date().toISOString().slice(0, 10)}`;
}

function hasCurrentEmployer(user: User | null | undefined): boolean {
  return Boolean(
    user?.experience?.some((entry) => entry?.current && (entry.companyId || entry.company)),
  );
}

/**
 * "Time to rate your employer". Shown at most once a day (localStorage, keyed
 * per user and date), only inside the rating window, only when the user has a
 * current employer and the server still wants a rating.
 */
export function MonthlyPromptCard({ user }: { user: User }) {
  const eligible = hasCurrentEmployer(user) && isWithinRatingWindow();
  const { data } = useMonthlyPrompt(eligible);

  // Read once, lazily: on the server there is no localStorage, so the card
  // starts dismissed. That never causes a hydration mismatch because the
  // prompt also needs `shouldPrompt`, which is only known after the query
  // resolves in the browser.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(window.localStorage.getItem(seenKey(user._id)));
    } catch {
      return false;
    }
  });

  const visible = eligible && Boolean(data?.shouldPrompt) && !dismissed;

  // Mark it seen as soon as it is actually shown, exactly like the mobile app.
  useEffect(() => {
    if (!visible) return;
    try {
      window.localStorage.setItem(seenKey(user._id), "1");
    } catch {
      /* private mode - the prompt just returns next visit */
    }
  }, [visible, user._id]);

  if (!visible) return null;

  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600"
        >
          <Star className="size-5 fill-star text-star" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-900">Time to rate your employer</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You can submit your monthly rating between {ratingWindowLabel()} of each month.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="h-11 bg-brand-700 text-white sm:flex-1">
          <Link href="/dashboard/ratings/rate">Rate now</Link>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-11 text-muted-foreground sm:flex-1"
          onClick={() => setDismissed(true)}
        >
          Maybe later
        </Button>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, PenLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from "@/lib/rating-window";
import { cn } from "@/lib/utils";

const TILE =
  "flex min-h-28 flex-col justify-end gap-3 rounded-2xl p-4 text-left text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

/**
 * The two shortcuts under the rating card. "Write a Review" is gated: KYC
 * first, then the 1st-10th rating window, mirroring the mobile home screen.
 */
export function ActionTiles() {
  const router = useRouter();
  const kyc = useKycGate();

  function handleWriteReview() {
    if (!kyc.requireVerified()) return;
    if (!isWithinRatingWindow()) {
      toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
      return;
    }
    router.push("/dashboard/ratings/rate");
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Link href="/dashboard/explore" className={cn(TILE, "bg-brand-700")}>
        <Sparkles aria-hidden="true" className="size-6 opacity-80" />
        <span className="text-sm font-medium">See top-rated companies!</span>
        <span className="flex items-center gap-1 text-sm font-bold">
          Explore Reviews
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      </Link>

      <button type="button" onClick={handleWriteReview} className={cn(TILE, "bg-accent-600")}>
        <PenLine aria-hidden="true" className="size-6 opacity-80" />
        <span className="text-sm font-medium">Let your voice be heard!</span>
        <span className="flex items-center gap-1 text-sm font-bold">
          Write a Review
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      </button>

      {kyc.fallback}
    </div>
  );
}

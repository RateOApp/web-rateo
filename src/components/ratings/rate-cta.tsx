"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from "@/lib/rating-window";

type RateCtaProps = {
  /** A review by this user on their employer already exists this month. */
  ratedThisMonth: boolean;
};

/**
 * Sticky "Update company rating" button. Gates, in the order the mobile screen
 * checks them: KYC → rating window → already rated this month.
 */
export function RateCta({ ratedThisMonth }: RateCtaProps) {
  const router = useRouter();
  const kyc = useKycGate();
  const [windowOpen, setWindowOpen] = useState(false);

  function handleClick() {
    if (!kyc.requireVerified()) return;

    if (!isWithinRatingWindow()) {
      setWindowOpen(true);
      return;
    }
    if (ratedThisMonth) {
      toast.info("Already rated", {
        description: "You have already rated your company this month.",
      });
      return;
    }
    router.push("/dashboard/ratings/rate");
  }

  return (
    <>
      {/* Pinned above the mobile tab bar; an ordinary block on desktop. */}
      <div className="sticky bottom-20 z-10 -mx-4 border-y border-border bg-cream-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:rounded-2xl md:border md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          type="button"
          size="lg"
          onClick={handleClick}
          className="h-11 w-full text-sm font-semibold"
        >
          {ratedThisMonth ? "Rated this month ✓" : "Update company rating"}
        </Button>
      </div>

      {/* `null` inside the dashboard (the provider renders its own dialog). */}
      {kyc.fallback}

      <Dialog open={windowOpen} onOpenChange={setWindowOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{RATING_UNAVAILABLE_TITLE}</DialogTitle>
            <DialogDescription>{RATING_UNAVAILABLE_MESSAGE}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => setWindowOpen(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

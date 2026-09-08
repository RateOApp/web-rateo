"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { getApiErrorMessage } from "@/lib/api/client";
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from "@/lib/rating-window";
import { candidatesService } from "@/services/candidates";

type TalentActionsProps = {
  candidateId: string;
  candidateName: string;
  isEmployee: boolean;
  /** This company has already rated the employee in the current month. */
  alreadyRated: boolean;
  /** Present when the profile was opened from a job's applicants list. */
  jobId?: string;
};

/**
 * The action row under a talent's summary. An employee gets Send message +
 * Rate (window- and once-a-month-gated); everyone else gets Send a message and,
 * when opened from a job, Reject.
 */
export function TalentActions({
  candidateId,
  candidateName,
  isEmployee,
  alreadyRated,
  jobId,
}: TalentActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const kyc = useKycGate();

  const [confirmReject, setConfirmReject] = useState(false);
  const [busy, setBusy] = useState(false);

  function handleMessage() {
    kyc.requireVerified(() =>
      router.push(`/dashboard/messages/${candidateId}`),
    );
  }

  function handleRate() {
    if (!isWithinRatingWindow()) {
      toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
      return;
    }
    if (alreadyRated) {
      toast.info("Already rated", {
        description: `You have already rated ${candidateName} this month. You can rate again next month.`,
      });
      return;
    }
    router.push(`/dashboard/ratings/rate/${candidateId}`);
  }

  async function handleReject() {
    if (!jobId || busy) return;
    setBusy(true);
    try {
      await candidatesService.updateApplicantStatus(jobId, candidateId, "rejected");
      toast.success("Applicant rejected");
      void queryClient.invalidateQueries({ queryKey: ["jobApplicants", jobId] });
      setConfirmReject(false);
      router.back();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reject applicant"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          className="h-11 sm:flex-1"
          onClick={handleMessage}
        >
          {isEmployee ? "Send message" : "Send a message"}
        </Button>

        {isEmployee ? (
          <Button
            size="lg"
            className="h-11 bg-brand-700 text-white sm:flex-1"
            disabled={alreadyRated}
            onClick={handleRate}
          >
            {alreadyRated ? "Rated this month" : "Rate"}
          </Button>
        ) : jobId ? (
          <Button
            variant="destructive"
            size="lg"
            className="h-11 sm:flex-1"
            onClick={() => setConfirmReject(true)}
          >
            Reject
          </Button>
        ) : null}
      </div>

      {isEmployee && alreadyRated ? (
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve already rated this staff this month. Rating opens again next month.
        </p>
      ) : null}

      <Dialog
        open={confirmReject}
        onOpenChange={(next) => (busy ? null : setConfirmReject(next))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Applicant</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this applicant?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => setConfirmReject(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={busy}
              onClick={() => void handleReject()}
            >
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {kyc.fallback}
    </>
  );
}

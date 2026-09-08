"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/client";
import { candidatesService } from "@/services/candidates";

/**
 * "Report Candidate" - `POST /users/:id/report { reason, details }`. The reason
 * is required (the controller 400s without it); details are optional.
 */
export function ReportDialog({
  candidateId,
  open,
  onOpenChange,
}: {
  candidateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setBusy(true);
    try {
      await candidatesService.report(candidateId, reason.trim(), details.trim() || undefined);
      toast.success("Candidate reported successfully");
      setReason("");
      setDetails("");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not report candidate"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? null : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Candidate</DialogTitle>
          <DialogDescription>
            Please provide a reason for reporting this candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            aria-label="Reason"
            placeholder="Reason (e.g. Fake profile, Harassment)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Textarea
            aria-label="Additional details"
            placeholder="Additional details (optional)"
            rows={4}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="bg-brand-700 text-white"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

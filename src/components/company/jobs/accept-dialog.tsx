"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Accepting converts the applicant into an employee server-side, so it is the
 * one applicant action that asks first. Copy is verbatim from mobile.
 */
export function AcceptDialog({
  open,
  onOpenChange,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? null : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accept this candidate?</DialogTitle>
          <DialogDescription>
            You have reviewed this candidate and want to accept them into your company as an
            employee.
          </DialogDescription>
        </DialogHeader>
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
            disabled={busy}
            onClick={onConfirm}
            className="bg-brand-700 text-white"
          >
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            Yes, accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

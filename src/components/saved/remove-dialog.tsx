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
 * Shared confirm sheet for the Saved tabs and the job detail actions. The
 * default copy is verbatim from mobile; callers that destroy something other
 * than a row (withdrawing interest) override it.
 */
export function RemoveDialog({
  open,
  onOpenChange,
  onConfirm,
  busy = false,
  title = "Are you sure you want to delete?",
  description = "This action cannot be undone.",
  confirmLabel = "Yes, delete",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  busy?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? null : onOpenChange(next))}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
          <Button variant="destructive" size="lg" disabled={busy} onClick={onConfirm}>
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

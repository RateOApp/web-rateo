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

/** Shared confirm sheet for both Saved tabs. Copy is verbatim from mobile. */
export function RemoveDialog({
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
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
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

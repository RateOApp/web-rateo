"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
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
 * Shown when the backend answers `403 { code: 'PARTICIPATION_OVERDUE' }`, or
 * when we pre-empt it locally. Copy is verbatim from app-rateo's
 * `ParticipationLockSheet`.
 */
export function ParticipationLockDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger"
          >
            <Lock className="size-7" />
          </span>
          <DialogTitle className="text-xl">Feature locked</DialogTitle>
          <DialogDescription>
            This feature is locked until you complete your monthly rating. Submit your rating for
            this month (1st&ndash;10th) to unlock it instantly.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" className="h-11 w-full bg-brand-700 text-white">
            <Link href="/dashboard/ratings" onClick={() => onOpenChange(false)}>
              Complete my rating
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-11 w-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

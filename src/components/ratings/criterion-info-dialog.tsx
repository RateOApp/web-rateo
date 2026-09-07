"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCriterionInfo } from "@/lib/rating-criteria";

type CriterionInfoDialogProps = {
  criterion: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * "What does this criterion cover?" — the web version of mobile's
 * `RatingInfoModal`. Renders nothing for criteria with no entry in
 * `RATING_CRITERIA_INFO`.
 */
export function CriterionInfoDialog({
  criterion,
  open,
  onOpenChange,
}: CriterionInfoDialogProps) {
  const info = getCriterionInfo(criterion);
  if (!info || !criterion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{criterion}</DialogTitle>
          <DialogDescription>{info.summary}</DialogDescription>
        </DialogHeader>

        <p className="text-sm font-semibold text-brand-900">
          This rating may include:
        </p>
        <ul className="flex flex-col gap-2">
          {info.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

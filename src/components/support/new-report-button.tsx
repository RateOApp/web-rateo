"use client";

import { useState } from "react";
import Link from "next/link";
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
 * **New Report** on the support thread. It confirms first, because creating a
 * ticket CLOSES every other open one server-side (`createTicket`) - the copy is
 * verbatim from the mobile alert.
 */
export function NewReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        New Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Start New Report?</DialogTitle>
            <DialogDescription>
              This will let you report a different problem. Your current conversation will
              remain saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button asChild size="lg" className="bg-brand-700 text-white">
              <Link href="/dashboard/report?new=1" onClick={() => setOpen(false)}>
                Start new report
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Flag, Loader2, MoreVertical } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/client";
import { jobsService } from "@/services/jobs";

/**
 * Overflow menu on the job detail page: report the listing, or hide it for
 * good. Native jobs only - imported listings have no employer to report to and
 * no block list entry.
 */
export function JobMenu({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitReport() {
    if (busy) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setBusy(true);
    try {
      await jobsService.report(jobId, reason.trim(), details.trim() || undefined);
      setReportOpen(false);
      setReason("");
      setDetails("");
      toast.success("Job reported successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not report this job"));
    } finally {
      setBusy(false);
    }
  }

  async function hideJob() {
    if (busy) return;
    setBusy(true);
    try {
      await jobsService.block(jobId);
      setHideOpen(false);
      toast.success("Job hidden successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not hide this job"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More options"
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setReportOpen(true);
            }}
          >
            <Flag aria-hidden="true" />
            Report Job
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setHideOpen(true);
            }}
          >
            <EyeOff aria-hidden="true" />
            Not Interested
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ---- report ------------------------------------------------- */}
      <Dialog open={reportOpen} onOpenChange={(next) => (busy ? null : setReportOpen(next))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Job</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this job.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-reason">Reason</Label>
              <Input
                id="report-reason"
                value={reason}
                placeholder="Reason (e.g. Scam, Offensive)"
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-details">Additional details</Label>
              <Textarea
                id="report-details"
                value={details}
                rows={4}
                placeholder="Additional details (optional)"
                onChange={(event) => setDetails(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => setReportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="bg-brand-700 text-white"
              disabled={busy}
              onClick={() => void submitReport()}
            >
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- not interested ----------------------------------------- */}
      <Dialog open={hideOpen} onOpenChange={(next) => (busy ? null : setHideOpen(next))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Not Interested</DialogTitle>
            <DialogDescription>
              Are you sure you want to hide this job? You won&rsquo;t see it in search results
              anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" disabled={busy} onClick={() => setHideOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="lg" disabled={busy} onClick={() => void hideJob()}>
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

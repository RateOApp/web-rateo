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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/client";
import { messagesService } from "@/services/messages";

/**
 * Reports one message to the admins. Copy is verbatim from the mobile report
 * sheet - the reason is required, the details are not.
 */
export function ReportMessageDialog({
  messageId,
  open,
  onOpenChange,
}: {
  messageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setReason("");
    setDetails("");
    onOpenChange(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !messageId) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setBusy(true);
    try {
      await messagesService.report(messageId, reason.trim(), details.trim() || undefined);
      toast.success("Message reported successfully");
      setReason("");
      setDetails("");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to report message"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Message</DialogTitle>
          <DialogDescription>
            Please provide a reason for reporting this message.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-message-reason">Reason</Label>
            <Input
              id="report-message-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason (e.g. Harassment, Spam)"
              className="h-11"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-message-details">Details</Label>
            <Textarea
              id="report-message-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="lg" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-brand-700 text-white"
              disabled={busy || !reason.trim()}
            >
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

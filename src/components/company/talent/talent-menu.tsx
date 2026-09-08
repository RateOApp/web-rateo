"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag, Loader2, MoreVertical, UserMinus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReportDialog } from "@/components/company/talent/report-dialog";
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
import { COMPANY_EMPLOYEES_KEY } from "@/hooks/use-company-employees";
import { getApiErrorMessage } from "@/lib/api/client";
import { candidatesService } from "@/services/candidates";

type Confirm = "block" | "terminate" | null;

/**
 * The overflow menu on a talent profile: report, block and - for an employee
 * of this company - terminate the contract (the real `DELETE
 * /users/company/employees/:id`, which opens a 3-day recovery window).
 */
export function TalentMenu({
  candidateId,
  candidateName,
  isEmployee,
}: {
  candidateId: string;
  candidateName: string;
  isEmployee: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [reportOpen, setReportOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  async function handleBlock() {
    if (busy) return;
    setBusy(true);
    try {
      await candidatesService.block(candidateId);
      toast.success("Candidate blocked successfully");
      setConfirm(null);
      router.back();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not block candidate"));
    } finally {
      setBusy(false);
    }
  }

  async function handleTerminate() {
    if (busy) return;
    setBusy(true);
    try {
      await candidatesService.terminateEmployee(candidateId);
      toast.success("Contract terminated", {
        description: `${candidateName} can be recovered within 3 days.`,
      });
      void queryClient.invalidateQueries({ queryKey: COMPANY_EMPLOYEES_KEY });
      setConfirm(null);
      router.back();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not terminate contract"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Candidate options"
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setReportOpen(true);
            }}
          >
            <Flag aria-hidden="true" />
            Report Candidate
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setConfirm("block");
            }}
          >
            <Ban aria-hidden="true" />
            Block Candidate
          </DropdownMenuItem>
          {isEmployee ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                setConfirm("terminate");
              }}
            >
              <UserMinus aria-hidden="true" />
              Terminate contract
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        candidateId={candidateId}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      <Dialog
        open={confirm !== null}
        onOpenChange={(next) => (busy || next ? null : setConfirm(null))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirm === "terminate" ? "Terminate contract?" : "Block Candidate"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "terminate"
                ? "This employee will be moved to Terminated with a 3-day recovery window."
                : "Are you sure you want to block this candidate? You won't see them in search results anymore."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={busy}
              onClick={() =>
                void (confirm === "terminate" ? handleTerminate() : handleBlock())
              }
            >
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              {confirm === "terminate" ? "Terminate" : "Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

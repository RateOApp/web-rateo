"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { getApiErrorMessage } from "@/lib/api/client";
import { hardNavigate } from "@/lib/navigate";
import { authService } from "@/services/auth";
import { usersService } from "@/services/users";

type Stage = null | "warn" | "confirm";

/**
 * Account deletion behind the same double confirmation the mobile app uses.
 * `DELETE /users/:id` deactivates immediately and purges after 14 days.
 */
export function DeleteAccountDialog({ userId }: { userId: string | undefined }) {
  const [stage, setStage] = useState<Stage>(null);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!userId || pending) return;
    setPending(true);
    try {
      await usersService.deleteAccount(userId);
      toast.success("Account deactivated", {
        description: "It will be permanently deleted in 14 days — log in again to cancel.",
      });
      await authService.logout();
      hardNavigate("/login");
    } catch (error) {
      setPending(false);
      setStage(null);
      toast.error(getApiErrorMessage(error, "Failed to delete account"));
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <button
          type="button"
          onClick={() => setStage("warn")}
          disabled={!userId}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" className="size-5" />
          Delete Account
        </button>
      </section>

      <Dialog
        open={stage === "warn"}
        onOpenChange={(open) => setStage(open ? "warn" : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your account will be deactivated immediately and permanently deleted after
              14 days. Logging in again within 14 days cancels the deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={() => setStage(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => setStage("confirm")}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={stage === "confirm"}
        onOpenChange={(open) => {
          if (!pending) setStage(open ? "confirm" : null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              Your account disappears from Rateo now and is permanently deleted on day 14
              unless you log back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={() => setStage(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={pending}
              onClick={() => void handleDelete()}
            >
              {pending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

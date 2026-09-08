"use client";

import { ShieldAlert } from "lucide-react";
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
 * Shown when `account_status_changed` says an admin suspended this account.
 *
 * There is no dismiss: every protected endpoint now answers 403, so the only
 * useful action is to log out. The dialog is intentionally not closable from
 * the overlay or Escape.
 */
export function AccountSuspendedDialog({
  open,
  onLogout,
  busy = false,
}: {
  open: boolean;
  onLogout: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          >
            <ShieldAlert className="size-7" />
          </span>
          <DialogTitle className="text-xl">Account Suspended</DialogTitle>
          <DialogDescription className="text-base text-foreground">
            Your account has been suspended by an administrator. Contact support if you think
            this is a mistake.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:flex-col">
          <Button
            size="lg"
            className="h-11 w-full bg-brand-700 text-white"
            disabled={busy}
            onClick={onLogout}
          >
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

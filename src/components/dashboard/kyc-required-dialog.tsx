"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
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
 * The KYC gate. Copy is verbatim from app-rateo's `KycRequiredModal`, which in
 * turn mirrors rateo-app's KycVerificationModal - do not reword it.
 */
export function KycRequiredDialog({
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
            className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"
          >
            <ShieldCheck className="size-7" />
          </span>
          <DialogTitle className="text-xl text-brand-700">Verification Required</DialogTitle>
          <DialogDescription className="text-base text-foreground">
            You cannot access this service until you complete your KYC verification process.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          KYC (Know Your Customer) verification helps us maintain security and comply with
          regulations. The process typically takes 1-2 business days once submitted.
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" className="h-11 w-full bg-brand-700 text-white">
            <Link href="/dashboard/kyc" onClick={() => onOpenChange(false)}>
              Start Verification
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full border-brand-700 text-brand-700"
            onClick={() => onOpenChange(false)}
          >
            Go back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

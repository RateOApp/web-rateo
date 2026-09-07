import Link from "next/link";
import { AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KycStatus } from "@/types/api";

type VerificationCardProps = {
  status?: KycStatus;
  /** Overrides the default body copy for this surface. */
  message?: string;
  className?: string;
};

const COPY = {
  none: {
    title: "Verification Required",
    body: "You need to complete your KYC verification to access this feature.",
    action: "Start Verification",
    icon: ShieldCheck,
  },
  pending: {
    title: "Verification in Progress",
    body: "Your documents are under review. Please check back later.",
    action: "Check Status",
    icon: Clock,
  },
  rejected: {
    title: "Verification Rejected",
    body: "Your documents were not approved. Please upload them again.",
    action: "Try Again",
    icon: AlertCircle,
  },
  verified: {
    title: "Verification Required",
    body: "You need to complete your KYC verification to access this feature.",
    action: "Start Verification",
    icon: ShieldCheck,
  },
} as const;

/** The standalone card. Ported from app-rateo's `VerificationCard`. */
export function VerificationCard({
  status = "none",
  message,
  className,
}: VerificationCardProps) {
  const copy = COPY[status] ?? COPY.none;
  const Icon = copy.icon;

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-2xl border border-border bg-white p-6 text-center shadow-lg",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"
      >
        <Icon className="size-7" />
      </span>
      <p className="text-lg font-bold text-brand-700">{copy.title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message ?? copy.body}</p>
      <Button asChild size="lg" className="mt-5 h-11 w-full bg-brand-700 text-white">
        <Link href="/dashboard/kyc">{copy.action}</Link>
      </Button>
    </div>
  );
}

/**
 * The dimming overlay variant: the real content stays mounted but faded and
 * inert behind the card, exactly like the mobile Explore gate.
 */
export function VerificationGate({
  verified,
  status,
  message,
  children,
  className,
}: VerificationCardProps & { verified: boolean; children: React.ReactNode }) {
  if (verified) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="pointer-events-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-x-0 top-0 flex justify-center px-4 pt-10 sm:pt-16">
        <VerificationCard status={status} message={message} />
      </div>
    </div>
  );
}

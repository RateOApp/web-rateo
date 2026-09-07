import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { User } from "@/types/api";
import { cn } from "@/lib/utils";

type KycStatus = NonNullable<User["kycStatus"]>;

type VerifiedBadgeProps = {
  status?: KycStatus;
  className?: string;
};

const STATUS = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-success/10 text-success",
  },
  pending: {
    label: "Verification pending",
    icon: ShieldQuestion,
    className: "bg-accent-50 text-accent-600",
  },
  rejected: {
    label: "Verification failed",
    icon: ShieldAlert,
    className: "bg-danger/10 text-danger",
  },
  none: {
    label: "Unverified",
    icon: ShieldAlert,
    className: "bg-muted text-muted-foreground",
  },
} as const satisfies Record<
  KycStatus,
  { label: string; icon: typeof ShieldCheck; className: string }
>;

/** Small KYC pill. Mirrors the mobile app's verified state on profiles. */
export function VerifiedBadge({ status = "none", className }: VerifiedBadgeProps) {
  const { label, icon: Icon, className: tone } = STATUS[status] ?? STATUS.none;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

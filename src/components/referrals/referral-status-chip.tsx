import { cn } from "@/lib/utils";
import type { ReferralStatus } from "@/types/referrals";

/** Amber = waiting on KYC, green = counted, grey = voided by an admin. */
const STYLES: Record<ReferralStatus, string> = {
  pending: "bg-accent-50 text-accent-600",
  verified: "bg-success/10 text-success",
  void: "bg-muted text-muted-foreground",
};

const LABELS: Record<ReferralStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  void: "Void",
};

export function ReferralStatusChip({
  status,
  className,
}: {
  status: ReferralStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status] ?? STYLES.void,
        className,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

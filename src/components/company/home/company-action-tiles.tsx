"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, PenLine, Sparkles } from "lucide-react";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { cn } from "@/lib/utils";

const TILE =
  "flex min-h-28 flex-col justify-end gap-3 rounded-2xl p-4 text-left text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

/**
 * The two quick actions under the rating card. Both are KYC-gated, exactly
 * like the mobile home screen: an unverified company gets the dialog instead
 * of the destination.
 */
export function CompanyActionTiles() {
  const router = useRouter();
  const kyc = useKycGate();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => kyc.requireVerified(() => router.push("/dashboard/jobs/new"))}
        className={cn(TILE, "bg-brand-700")}
      >
        <Sparkles aria-hidden="true" className="size-6 opacity-80" />
        <span className="text-sm font-medium">Looking for qualified talents?</span>
        <span className="flex items-center gap-1 text-sm font-bold">
          Post a job opening
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      </button>

      <button
        type="button"
        onClick={() => kyc.requireVerified(() => router.push("/dashboard/employees"))}
        className={cn(TILE, "bg-accent-600")}
      >
        <PenLine aria-hidden="true" className="size-6 opacity-80" />
        <span className="text-sm font-medium">Let your workers know how they are doing!</span>
        <span className="flex items-center gap-1 text-sm font-bold">
          Write a Review
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      </button>

      {kyc.fallback}
    </div>
  );
}

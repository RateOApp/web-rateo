"use client";

import { AlertCircle } from "lucide-react";

import { ReferralCodeCard } from "@/components/referrals/referral-code-card";
import { ReferralList } from "@/components/referrals/referral-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyReferral } from "@/hooks/use-referrals";
import type { ReferralStats } from "@/types/referrals";

const TILES: { key: keyof ReferralStats; label: string }[] = [
  { key: "total", label: "Total" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
];

function StatTiles({ stats }: { stats: ReferralStats | undefined }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white">
      {TILES.map((tile) => (
        <div key={tile.key} className="flex flex-col items-center gap-1 p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
          <p className="text-2xl font-bold tabular-nums text-brand-900">
            {stats ? (stats[tile.key] ?? 0) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * `/dashboard/referrals` for both roles — an individual and a company see the
 * same thing, because anyone can refer anyone.
 */
export function ReferralHub() {
  const { data: referral, isLoading, isError } = useMyReferral();

  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm text-destructive"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>Could not load your invite code. Please refresh and try again.</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {isLoading || !referral ? (
        <Skeleton className="h-60 rounded-2xl" />
      ) : (
        <ReferralCodeCard referral={referral} />
      )}

      <StatTiles stats={referral?.stats} />

      <p className="text-sm text-muted-foreground">
        A referral counts once your friend completes verification.
      </p>

      <ReferralList />
    </div>
  );
}

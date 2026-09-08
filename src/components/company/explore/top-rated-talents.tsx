"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { ParticipationChip } from "@/components/dashboard/participation-chip";
import { ParticipationRing } from "@/components/dashboard/participation-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { compareTopRated, formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import { candidateName, candidateTitleLabel, type Candidate } from "@/types/candidates";

/**
 * The three best-ranked talents, by the same rating + participation blend the
 * mobile app uses (`topRatedScore`), so a five-star candidate who stops rating
 * their employer cannot camp at the top.
 */
export function TopRatedTalents({
  candidates,
  dimmed = false,
  onOpen,
}: {
  candidates: Candidate[];
  /** Unverified companies see the cards faded and clicks go to the KYC gate. */
  dimmed?: boolean;
  onOpen?: (id: string) => boolean;
}) {
  const top = [...candidates].sort(compareTopRated).slice(0, 3);

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-brand-900">Top rated talents</h2>

      {top.length ? (
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {top.map((candidate) => (
            <li key={candidate._id} className="w-56 shrink-0 snap-start">
              <Link
                href={`/dashboard/talent/${candidate._id}`}
                onClick={(event) => {
                  if (onOpen && !onOpen(candidate._id)) event.preventDefault();
                }}
                className={cn(
                  "flex h-full flex-col gap-2 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  dimmed && "opacity-50",
                )}
              >
                <UserAvatar user={candidate} size="lg" />
                <p className="truncate font-semibold text-brand-900">
                  {candidateName(candidate)}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {candidateTitleLabel(candidate)}
                </p>
                <StarRating
                  value={candidate.overallRating ?? 0}
                  label={formatRating(candidate.overallRating)}
                />
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <ParticipationRing
                    score={candidate.participationScore ?? null}
                    status={candidate.participationStatus ?? null}
                    size={34}
                    percent
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Participation</p>
                    <ParticipationChip
                      score={candidate.participationScore ?? null}
                      status={candidate.participationStatus ?? null}
                      showNotEstablished
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Users}
          title="No top talents available"
          description="There are currently no top-rated talents to display."
        />
      )}
    </section>
  );
}

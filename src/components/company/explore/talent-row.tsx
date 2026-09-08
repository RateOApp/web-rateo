"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import { candidateName, candidateTitleLabel, type Candidate } from "@/types/candidates";

/**
 * One talent row: avatar, name, title and rating, with an optional message
 * shortcut (used on the search results list, like the mobile screen).
 */
export function TalentRow({
  candidate,
  dimmed = false,
  onOpen,
  onMessage,
}: {
  candidate: Candidate;
  dimmed?: boolean;
  /** Return `false` to swallow the navigation (the KYC gate opened instead). */
  onOpen?: (id: string) => boolean;
  onMessage?: (candidate: Candidate) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-white p-3 sm:p-4",
        dimmed && "opacity-50",
      )}
    >
      <Link
        href={`/dashboard/talent/${candidate._id}`}
        onClick={(event) => {
          if (onOpen && !onOpen(candidate._id)) event.preventDefault();
        }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <UserAvatar user={candidate} size="default" className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-brand-900">
            {candidateName(candidate)}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {candidateTitleLabel(candidate)}
          </span>
        </span>
      </Link>

      <StarRating
        value={candidate.overallRating ?? 0}
        size={14}
        label={formatRating(candidate.overallRating)}
        className="shrink-0"
      />

      {onMessage ? (
        <button
          type="button"
          aria-label={`Message ${candidateName(candidate)}`}
          onClick={() => onMessage(candidate)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Send aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

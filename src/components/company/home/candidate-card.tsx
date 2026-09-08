"use client";

import Link from "next/link";
import { ChevronRight, Heart, Loader2, X } from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  candidateName,
  candidateRating,
  candidateTitleLabel,
  type Candidate,
} from "@/types/candidates";

type CandidateCardProps = {
  candidate: Candidate;
  /** 0-100 from `computeCandidateMatch`. */
  match: number;
  onPass: () => void;
  onLike: () => void;
  pending?: boolean;
  className?: string;
};

/** At most three skill chips; the rest collapse into "+N" (mirrors mobile). */
const MAX_SKILLS = 3;

/**
 * One card in the company home candidate feed: the browser stand-in for the
 * mobile swipe deck. Only the NAME opens the profile - "Like" saves the
 * candidate and "Pass" dismisses locally, both owned by the parent.
 */
export function CandidateCard({
  candidate,
  match,
  onPass,
  onLike,
  pending = false,
  className,
}: CandidateCardProps) {
  const name = candidateName(candidate);
  const rating = candidateRating(candidate);
  const skills = (candidate.skills ?? []).filter((skill) => Boolean(skill?.trim()));
  const shown = skills.slice(0, MAX_SKILLS);
  const extra = skills.length - shown.length;

  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-border bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div>
        <div className="flex gap-3">
          <UserAvatar user={candidate} size="lg" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/talent/${candidate._id}`}
              className="flex items-center gap-1 rounded font-semibold text-brand-900 transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="truncate">{name}</span>
              {candidate.isOg ? (
                <Badge
                  className="bg-accent-600 text-white"
                  title="Original Gangster - early Rate'O member"
                >
                  OG
                </Badge>
              ) : null}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-brand-700" />
            </Link>

            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {candidateTitleLabel(candidate)}
            </p>

            <StarRating value={rating ?? 0} size={18} className="mt-1.5" />
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {shown.length ? (
            <>
              {shown.map((skill) => (
                <li key={skill}>
                  <Badge variant="secondary" className="max-w-full truncate">
                    {skill}
                  </Badge>
                </li>
              ))}
              {extra > 0 ? (
                <li>
                  <Badge variant="secondary">+{extra}</Badge>
                </li>
              ) : null}
            </>
          ) : (
            <li>
              <Badge variant="secondary">No skills listed yet</Badge>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Pass on ${name}`}
          onClick={onPass}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <span className="flex items-center gap-2 rounded-full border border-success py-1 pr-3 pl-1">
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-accent-600 text-[10px] font-bold text-accent-600 tabular-nums">
            {match}%
          </span>
          <span className="text-sm font-medium text-brand-900">Match</span>
        </span>

        <button
          type="button"
          aria-label={`Save ${name}`}
          onClick={onLike}
          disabled={pending}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          {pending ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Heart aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
    </article>
  );
}

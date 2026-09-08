"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, FileText, Heart, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { ParticipationStatCard } from "@/components/dashboard/participation-stat-card";
import { TalentActions } from "@/components/company/talent/talent-actions";
import { TalentMenu } from "@/components/company/talent/talent-menu";
import { TalentWorkHistory } from "@/components/company/talent/talent-work-history";
import { MetricsBars, metricsFromBreakdown } from "@/components/ratings/metrics-bars";
import { PageContainer } from "@/components/layout/page-container";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { useParticipationOf } from "@/hooks/use-participation";
import { useResume } from "@/hooks/use-resume";
import { useUserReviews } from "@/hooks/use-reviews";
import { SAVED_CANDIDATES_KEY, useSavedCandidates } from "@/hooks/use-saved-candidates";
import { getApiErrorMessage } from "@/lib/api/client";
import { INDIVIDUAL_CRITERIA } from "@/lib/rating-criteria";
import { formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import { candidatesService } from "@/services/candidates";
import { usersService } from "@/services/users";
import type { User } from "@/types/api";
import {
  candidateName,
  candidateTitleLabel,
  type Candidate,
  type TalentExperience,
} from "@/types/candidates";

type TalentDetailProps = {
  candidateId: string;
  /** `?job=` - the profile was opened from that job's applicants list. */
  jobId?: string;
  /** `?employee=1` - treat the profile as an employee without re-deriving it. */
  employeeHint?: boolean;
  /** Pre-fetched profile (scratch pages only). */
  initialCandidate?: Candidate;
};

/**
 * A candidate / employee profile as seen by a company: summary, participation,
 * rating breakdown, skills, the action row, resume and work history.
 */
export function TalentDetail({
  candidateId,
  jobId,
  employeeHint = false,
  initialCandidate,
}: TalentDetailProps) {
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const { data: me } = useMe();

  const profile = useQuery({
    queryKey: ["candidateProfile", candidateId] as const,
    queryFn: () => usersService.byId(candidateId),
    enabled: !initialCandidate,
    staleTime: 60_000,
  });

  const candidate = initialCandidate ?? profile.data;
  const reviews = useUserReviews(candidateId);
  const participation = useParticipationOf(candidateId);
  const resume = useResume(candidateId);
  const saved = useSavedCandidates();

  const [savePending, setSavePending] = useState(false);

  const isSaved = (saved.data ?? []).some((entry) => entry._id === candidateId);

  const experience = (candidate?.experience ?? []) as TalentExperience[];

  const isEmployee =
    employeeHint ||
    experience.some(
      (entry) => entry.current && String(entry.companyId ?? "") === String(me?._id ?? "\0"),
    );

  // Has THIS company already rated the candidate in the current month? Derived
  // from the candidate's own reviews so it holds however the profile was opened.
  const alreadyRated = useMemo(() => {
    const now = new Date();
    return (reviews.data?.reviews ?? []).some((review) => {
      const reviewerId = review.reviewer?._id;
      if (!reviewerId || String(reviewerId) !== String(me?._id ?? "\0")) return false;
      const date = new Date(review.createdAt ?? 0);
      return (
        date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
      );
    });
  }, [reviews.data, me?._id]);

  const metrics = metricsFromBreakdown(
    INDIVIDUAL_CRITERIA,
    reviews.data?.detailsBreakdown,
  );

  const name = candidate ? candidateName(candidate) : "Talent";
  const rating = candidate?.overallRating ?? null;
  const skills = (candidate?.skills ?? []).filter((skill) => Boolean(skill?.trim()));

  async function handleSaveToggle() {
    if (savePending) return;
    if (!isSaved && !kyc.requireVerified()) return;

    setSavePending(true);
    try {
      if (isSaved) {
        await candidatesService.unsave(candidateId);
        queryClient.setQueryData<User[]>(SAVED_CANDIDATES_KEY, (old) =>
          Array.isArray(old) ? old.filter((entry) => entry._id !== candidateId) : old,
        );
        toast.success("Removed successfully");
      } else {
        await candidatesService.save(candidateId);
        toast.success("Candidate saved");
      }
      void queryClient.invalidateQueries({ queryKey: SAVED_CANDIDATES_KEY });
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update saved status");
      if (/kyc|verif/i.test(message)) kyc.open();
      else if (/already/i.test(message)) toast.info("Candidate already saved");
      else toast.error(message);
    } finally {
      setSavePending(false);
    }
  }

  return (
    <PageContainer className="flex flex-col gap-5">
      {/* ---- header ------------------------------------------------------ */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/candidates"
          aria-label="Back"
          className="rounded-lg p-2 text-brand-900 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-brand-900">
          {isEmployee ? "Employee profile" : "Talent details"}
        </h1>
        <TalentMenu
          candidateId={candidateId}
          candidateName={name}
          isEmployee={isEmployee}
        />
      </div>

      {/* ---- summary ----------------------------------------------------- */}
      <section className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 sm:p-5">
        {candidate ? (
          <UserAvatar user={candidate} size="lg" className="shrink-0" />
        ) : (
          <Skeleton className="size-14 shrink-0 rounded-full" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-lg font-bold text-brand-900">{name}</p>
            {candidate?.isOg ? (
              <Badge
                className="bg-accent-600 text-white"
                title="Original Gangster - early Rate'O member"
              >
                OG
              </Badge>
            ) : null}
          </div>
          {candidate?.publicId ? (
            <p className="text-xs text-muted-foreground">ID-{candidate.publicId}</p>
          ) : null}
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {candidate ? candidateTitleLabel(candidate) : ""}
          </p>
          <StarRating
            value={rating ?? 0}
            size={16}
            label={formatRating(rating)}
            className="mt-1.5"
          />
        </div>

        <button
          type="button"
          aria-label={isSaved ? `Remove ${name} from saved` : `Save ${name}`}
          aria-pressed={isSaved}
          disabled={savePending}
          onClick={() => void handleSaveToggle()}
          className="shrink-0 rounded-lg p-2 text-brand-900 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          {savePending ? (
            <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          ) : (
            <Heart
              aria-hidden="true"
              className={cn("size-6", isSaved && "fill-danger text-danger")}
            />
          )}
        </button>
      </section>

      <ParticipationStatCard
        rating={rating}
        score={participation.data?.participationScore ?? null}
        status={participation.data?.participationStatus ?? null}
      />

      {/* ---- rating breakdown -------------------------------------------- */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-900">Rating breakdown</h2>
        <MetricsBars rows={metrics} />
      </section>

      {skills.length ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill}>
              <Badge variant="secondary">{skill}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <TalentActions
        candidateId={candidateId}
        candidateName={name}
        isEmployee={isEmployee}
        alreadyRated={alreadyRated}
        jobId={jobId}
      />

      {/* ---- resume ------------------------------------------------------- */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-900">Resume</h2>
        {resume.data?.resume ? (
          <div className="flex items-center gap-2">
            <a
              href={resume.data.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 font-medium text-brand-900 transition-colors hover:border-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              View resume
              <Eye aria-hidden="true" className="size-5 shrink-0" />
            </a>
            <a
              href={resume.data.resume}
              download
              aria-label="Download resume"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-brand-900 transition-colors hover:border-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Download aria-hidden="true" className="size-5" />
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 text-muted-foreground opacity-70">
            No resume uploaded
            <FileText aria-hidden="true" className="size-5 shrink-0" />
          </div>
        )}
      </section>

      {/* ---- work history -------------------------------------------------- */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-900">Work History</h2>
        <TalentWorkHistory
          experience={experience}
          reviews={reviews.data?.reviews ?? []}
        />
      </section>

      {kyc.fallback}
    </PageContainer>
  );
}

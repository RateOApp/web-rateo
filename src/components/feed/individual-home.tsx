"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { KycBanner } from "@/components/dashboard/kyc-banner";
import { ParticipationBanner } from "@/components/dashboard/participation-banner";
import { ActionTiles } from "@/components/feed/action-tiles";
import { HomeRatingCard } from "@/components/feed/home-rating-card";
import { JobFeed } from "@/components/feed/job-feed";
import { MonthlyPromptCard } from "@/components/feed/monthly-prompt-card";
import { PageContainer } from "@/components/layout/page-container";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/hooks/use-me";
import { useParticipationStatus } from "@/hooks/use-participation";
import type { JobsResponse, User } from "@/types/api";

/**
 * The individual home screen: greeting, KYC nudge, rating + participation,
 * the two action tiles and the personalised job feed.
 *
 * `initialUser` comes from the server layout so the greeting paints with the
 * first byte; `useMe()` takes over once the (seeded) query resolves.
 */
export function IndividualHome({
  user: initialUser,
  initialJobs,
}: {
  user: User;
  initialJobs?: JobsResponse;
}) {
  const { data } = useMe();
  const user = data ?? initialUser;

  const participation = useParticipationStatus();

  return (
    <PageContainer className="flex flex-col gap-4">
      {/* ---- greeting -------------------------------------------------- */}
      <header className="flex items-center gap-3">
        <UserAvatar user={user} size="lg" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-lg font-semibold text-brand-900">
            Hello {user.firstName?.trim() || "there"}
          </p>
          {user.isOg ? (
            <Badge className="bg-accent-600 text-white" title="Original Gangster - early Rate'O member">
              OG
            </Badge>
          ) : null}
        </div>
      </header>

      <KycBanner status={user.kycStatus} />

      <ParticipationBanner
        status={participation.data?.participationStatus ?? null}
        outstanding={participation.data?.outstanding ?? 0}
      />

      <MonthlyPromptCard user={user} />

      {/* ---- rating + participation ------------------------------------ */}
      <section>
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Overall rating
        </h2>
        <HomeRatingCard userId={user._id} />
      </section>

      <ActionTiles />

      {/* ---- job feed --------------------------------------------------- */}
      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-900">Job opportunities for you</h2>
          <Link
            href="/dashboard/explore/jobs"
            className="flex shrink-0 items-center gap-1 rounded text-sm font-semibold text-accent-600 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            See all jobs
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <JobFeed user={user} initialData={initialJobs} />
      </section>
    </PageContainer>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle, Star } from "lucide-react";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { KycBanner } from "@/components/dashboard/kyc-banner";
import { CandidateFeed } from "@/components/company/home/candidate-feed";
import { ClaimRequests } from "@/components/company/home/claim-requests";
import { CompanyActionTiles } from "@/components/company/home/company-action-tiles";
import { CompanyRatingCard } from "@/components/company/home/company-rating-card";
import { EmployeeRatingPrompt } from "@/components/company/home/employee-rating-prompt";
import { PageContainer } from "@/components/layout/page-container";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/hooks/use-me";
import { useParticipationStatus } from "@/hooks/use-participation";
import { isWithinRatingWindow } from "@/lib/rating-window";
import { cn } from "@/lib/utils";
import type { ParticipationStatus, User, UsersResponse } from "@/types/api";

/**
 * Company wording for the monthly nudge banner. The individual copy talks
 * about "your employer"; a company owes ratings to each of its employees, so
 * the outstanding count is part of the sentence.
 */
export function companyBannerCopy(
  status: ParticipationStatus | null | undefined,
  outstanding: number,
): string {
  if (status === "overdue") return `Rate your employees — ${outstanding} left to unlock.`;
  if (status === "grace") {
    return `You missed last month — rate your employees (${outstanding} left) to stay on track.`;
  }
  return `Rate your employees — ${outstanding} left. Window closes on the 10th.`;
}

/** Same shape as the shared `ParticipationBanner`, with the company copy. */
function CompanyParticipationBanner({
  status,
  outstanding,
}: {
  status: ParticipationStatus | null | undefined;
  outstanding: number | null | undefined;
}) {
  if (!outstanding || outstanding <= 0) return null;
  if (!isWithinRatingWindow()) return null;

  const overdue = status === "overdue";

  return (
    <Link
      href="/dashboard/ratings"
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        overdue
          ? "border-danger/30 bg-danger/10 text-danger hover:bg-danger/15"
          : "border-accent-400 bg-accent-50 text-accent-600 hover:bg-cream-100",
      )}
    >
      <Star aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">{companyBannerCopy(status, outstanding)}</span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  );
}

/**
 * The company home screen: greeting, KYC nudge, participation, rating card,
 * quick actions, pending employee claims and the scored candidate feed.
 *
 * `initialUser` comes from the server layout so the greeting paints with the
 * first byte; `useMe()` takes over once the (seeded) query resolves.
 */
export function CompanyHome({
  user: initialUser,
  initialCandidates,
}: {
  user: User;
  initialCandidates?: UsersResponse;
}) {
  const { data } = useMe();
  const user = data ?? initialUser;

  const router = useRouter();
  const kyc = useKycGate();
  const participation = useParticipationStatus();

  return (
    <PageContainer className="flex flex-col gap-4">
      {/* ---- greeting -------------------------------------------------- */}
      <header className="flex items-center gap-3">
        <UserAvatar user={user} size="lg" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p className="truncate text-lg font-semibold text-brand-900">
            Hello {user.companyName?.trim() || "Company"}
          </p>
          {user.isOg ? (
            <Badge
              className="bg-accent-600 text-white"
              title="Original Gangster - early Rate'O company"
            >
              OG
            </Badge>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Messages"
          onClick={() => kyc.requireVerified(() => router.push("/dashboard/messages"))}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-brand-900 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
        </button>
      </header>

      <CompanyParticipationBanner
        status={participation.data?.participationStatus ?? null}
        outstanding={participation.data?.outstanding ?? 0}
      />

      <KycBanner status={user.kycStatus} />

      <EmployeeRatingPrompt user={user} />

      {/* ---- rating + participation ------------------------------------ */}
      <section>
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Overall rating
        </h2>
        <CompanyRatingCard userId={user._id} />
      </section>

      <CompanyActionTiles />

      <ClaimRequests />

      {/* ---- candidate feed --------------------------------------------- */}
      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-900">Top candidates for you</h2>
          <Link
            href="/dashboard/explore"
            className="flex shrink-0 items-center gap-1 rounded text-sm font-semibold text-accent-600 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            See all talents
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <CandidateFeed user={user} initialData={initialCandidates} />
      </section>

      {kyc.fallback}
    </PageContainer>
  );
}

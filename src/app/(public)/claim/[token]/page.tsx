import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Briefcase, Clock3, MapPin, Users } from "lucide-react";

import { ClaimButton } from "@/components/claim/claim-button";
import { StoreButtons } from "@/components/join/store-buttons";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { getCachedUser } from "@/lib/current-user";
import { humanizeEmploymentType } from "@/lib/format";
import { sanitiseClaimToken } from "@/lib/claim-token";
import { getServerSession } from "@/lib/session";
import { importedJobsServer } from "@/services/imported-jobs.server";
import type { ClaimInfo, ClaimReason } from "@/types/imported-jobs";

/**
 * Public and per-token, so it must never be cached: the same URL answers
 * `valid: true` before the listing is claimed and `valid: false` right after
 * (or once it expires), and a stale hit would show a dead claim button.
 */
const INFO = { auth: false, cache: "no-store" } as const;

/**
 * A bad, expired or already-claimed token is NOT a 404: the visitor still
 * gets a friendly, on-brand page. A backend outage degrades to the same
 * "can't be claimed" card rather than an error boundary - this URL is printed
 * on emails we do not control and cannot resend on demand.
 */
async function lookupClaim(token: string): Promise<ClaimInfo> {
  if (!token) return { valid: false, reason: "not_found" };
  try {
    return await importedJobsServer.claimInfo(token, INFO);
  } catch {
    return { valid: false, reason: "unavailable" };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const token = sanitiseClaimToken((await params).token);
  const info = await lookupClaim(token);

  const title =
    info.valid && info.jobTitle ? `Claim "${info.jobTitle}" on Rate'O` : "Claim your listing on Rate'O";

  return {
    title,
    // Tokenised, single-use URLs: never index, never let a search engine
    // follow the link either.
    robots: { index: false, follow: false },
  };
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">{children}</div>;
}

function CardIcon() {
  return (
    <span
      aria-hidden="true"
      className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"
    >
      <Briefcase className="size-6" />
    </span>
  );
}

const INVALID_COPY: Record<ClaimReason, { title: string; body: string }> = {
  expired: {
    title: "This claim link has expired",
    body: "Claim links last 14 days. Reply to the email you received and we'll send a fresh one.",
  },
  not_found: {
    title: "We couldn't find this listing",
    body: "The link may have already been used. If you've claimed it, sign in to your dashboard.",
  },
  unavailable: {
    title: "This listing can't be claimed any more",
    body: "It may have been removed or reassigned. Browse open roles on Rate'O instead.",
  },
};

function InvalidClaimCard({ reason }: { reason: ClaimReason }) {
  const copy = INVALID_COPY[reason];

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Card>
          <span
            aria-hidden="true"
            className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          >
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>

          <div className="mt-6">
            <p className="mb-2.5 text-sm font-medium text-brand-900">Get the app</p>
            <StoreButtons />
          </div>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <Link
              href="/jobs"
              className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Browse jobs on Rate&rsquo;O
            </Link>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const token = sanitiseClaimToken((await params).token);

  const [info, session] = await Promise.all([lookupClaim(token), getServerSession()]);

  if (!info.valid) {
    return <InvalidClaimCard reason={info.reason ?? "not_found"} />;
  }

  // `getCurrentUser` (behind this cache) returns `null` for a missing or
  // rejected token, same contract every other server component relies on -
  // so a stale/expired cookie renders the signed-out branch below rather than
  // a half-signed-in one.
  const user = session ? await getCachedUser() : null;
  const isCompany = user?.role === "company";

  const employmentType = humanizeEmploymentType(info.employmentType);
  const locationLine = info.location?.trim();
  const interestCount = info.interestCount ?? 0;

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Card>
          <CardIcon />

          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Claim your listing
          </h1>
          <p className="mt-2 text-base font-medium text-brand-900">
            {info.jobTitle || "This listing"}
            {info.companyName ? ` · ${info.companyName}` : ""}
          </p>

          {locationLine || employmentType ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {locationLine ? (
                <span className="flex items-center gap-1">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  {locationLine}
                </span>
              ) : null}
              {employmentType ? (
                <span className="flex items-center gap-1">
                  <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
                  {employmentType}
                </span>
              ) : null}
            </p>
          ) : null}

          {interestCount > 0 ? (
            <Badge className="mt-3 bg-accent-50 text-accent-600">
              <Users aria-hidden="true" />
              {interestCount} {interestCount === 1 ? "candidate has" : "candidates have"} shown
              interest
            </Badge>
          ) : null}

          {user ? (
            isCompany ? (
              <>
                <p className="mt-6 text-sm text-muted-foreground">
                  Claiming links this listing to your company. Once the Rate&rsquo;O team approves
                  it, you&rsquo;ll see everyone who registered interest.
                </p>
                <ClaimButton token={token} />
              </>
            ) : (
              <div className="mt-6 rounded-2xl bg-cream-50 p-5 sm:p-6">
                <p className="text-sm text-brand-900">
                  You&rsquo;re signed in with a personal account. Sign in with your company account
                  to claim this listing.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/claim/${token}`)}`}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Switch account
                </Link>
              </div>
            )
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href={`/login?next=${encodeURIComponent(`/claim/${token}`)}`}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Sign in to claim
                </Link>
                <Link
                  href="/register/company"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-brand-700 px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Create a company account
                </Link>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Already using the Rate&rsquo;O app?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(`/claim/${token}`)}`}
                  className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Sign in here
                </Link>{" "}
                with the same email and password.
              </p>

              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-2.5 text-sm font-medium text-brand-900">Get the app</p>
                <StoreButtons />
              </div>
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}

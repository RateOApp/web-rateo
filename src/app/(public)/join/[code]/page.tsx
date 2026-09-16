import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Smartphone, Sparkles } from "lucide-react";

import { CopyCodeButton } from "@/components/join/copy-code-button";
import { StoreButtons } from "@/components/join/store-buttons";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { normaliseReferralCode } from "@/lib/referral-code";
import { getServerSession } from "@/lib/session";
import { referralsServer } from "@/services/referrals.server";
import type { ReferralCodeLookup } from "@/types/referrals";

/** Public and identical for everyone, so it caches like the job pages. */
const LOOKUP = { auth: false, next: { revalidate: 300 } } as const;

/**
 * An invalid code is NOT a 404: the visitor still gets a working "Join Rate'O"
 * page. A backend outage degrades to the same generic page rather than an
 * error boundary — this URL is printed on invite links we do not control.
 */
async function lookupCode(code: string): Promise<ReferralCodeLookup> {
  if (!code) return { valid: false };
  try {
    return await referralsServer.lookupCode(code, LOOKUP);
  } catch {
    return { valid: false };
  }
}

/** "Tunde", or a role-appropriate stand-in when the backend sent no name. */
function referrerLabel(lookup: ReferralCodeLookup): string {
  const name = lookup.referrerName?.trim();
  if (name) return name;
  return lookup.referrerRole === "company" ? "A company" : "A friend";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const code = normaliseReferralCode((await params).code);
  const lookup = await lookupCode(code);

  const title = lookup.valid ? `${referrerLabel(lookup)} invited you to Rate'O` : "Join Rate'O";
  const description = lookup.valid
    ? `Use invite code ${code} when you sign up, and start rating the places you have worked.`
    : "Find jobs, discover companies and see how employers and employees really rate each other.";
  const url = `/join/${code}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
    twitter: { card: "summary_large_image", title, description },
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
      <Gift className="size-6" />
    </span>
  );
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normaliseReferralCode((await params).code);

  const [lookup, session] = await Promise.all([lookupCode(code), getServerSession()]);
  const valid = Boolean(code) && lookup.valid;
  const label = referrerLabel(lookup);

  // Already signed in: an invite code only ever applies to a NEW account, so
  // point them at their own referrals instead of the stores.
  if (session) {
    return (
      <PageContainer>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <Card>
            <CardIcon />
            <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
              You&rsquo;re already on Rate&rsquo;O
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {valid
                ? `An invite from ${label} only works on a brand-new account. Yours is already set up — share your own code instead.`
                : "Invite codes only work on a brand-new account. Share your own code instead."}
            </p>
            <Link
              href="/dashboard/referrals"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Go to your referrals
            </Link>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Card>
          <CardIcon />

          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            {valid ? `${label} invited you to Rate'O` : "Join Rate'O"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {valid
              ? "Rate'O is where people rate the places they have worked, and employers rate the people they have hired."
              : "Find jobs, discover companies and see how employers and employees really rate each other."}
          </p>

          {valid && lookup.isAmbassador ? (
            <Badge className="mt-3 bg-accent-50 text-accent-600">
              <Sparkles aria-hidden="true" />
              Rate&rsquo;O ambassador
            </Badge>
          ) : null}

          {valid ? (
            <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-cream-50 p-5 sm:p-6">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Your invite code
              </p>
              <p className="text-3xl font-bold tracking-[0.25em] break-all text-brand-900 sm:text-4xl">
                {code}
              </p>
              <CopyCodeButton code={code} className="w-full sm:w-auto" />
              <p className="text-center text-xs text-muted-foreground">
                Enter this code when you sign up in the app — it may already be filled in for you.
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-brand-900">
              <Smartphone aria-hidden="true" className="size-4 text-brand-700" />
              Get the app
            </p>
            <StoreButtons code={valid ? code : undefined} />
          </div>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <Link
              href={valid ? `/register?ref=${encodeURIComponent(code)}` : "/register"}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-brand-700 px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-auto sm:px-8"
            >
              Sign up on the web
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Registering a company?{" "}
              <Link
                href={valid ? `/register/company?ref=${encodeURIComponent(code)}` : "/register/company"}
                className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Create a company account
              </Link>
            </p>
          </div>
        </Card>

        {!valid && code ? (
          <p className="text-center text-xs text-muted-foreground">
            We could not find the invite code <span className="font-medium">{code}</span>. You can
            still join — ask your friend to re-send their link.
          </p>
        ) : null}
      </div>
    </PageContainer>
  );
}

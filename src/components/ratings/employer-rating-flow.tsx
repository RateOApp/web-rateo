"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { RatingFlow } from "@/components/ratings/rating-flow";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { useMonthlyPrompt } from "@/hooks/use-reviews";
import { COMPANY_CRITERIA } from "@/lib/rating-criteria";
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from "@/lib/rating-window";
import { companiesService } from "@/services/companies";

/**
 * `/dashboard/ratings/rate` — an individual rating their current employer.
 *
 * Everything here is the *entry* gate; the wizard itself is the shared
 * `RatingFlow`. The two door checks are deliberately separate: the window is
 * local and instant, while "already rated this month" is only knowable from
 * `GET /reviews/status/monthly`, so walking into the flow and failing at submit
 * is what we are avoiding.
 */
export function EmployerRatingFlow() {
  const router = useRouter();

  const { data: me, isPending: mePending } = useMe();
  const employer = me?.experience?.find((entry) => entry.current && entry.companyId);
  const companyId = employer?.companyId;

  const inWindow = isWithinRatingWindow();
  const bounced = useRef(false);

  const company = useQuery({
    queryKey: ["company", companyId ?? ""] as const,
    queryFn: () => companiesService.byId(companyId as string),
    enabled: Boolean(companyId) && inWindow,
    staleTime: 5 * 60 * 1000,
  });

  const monthly = useMonthlyPrompt(inWindow);

  // Door check 1: outside the window nothing can be submitted at all.
  useEffect(() => {
    if (inWindow || bounced.current) return;
    bounced.current = true;
    toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
    router.replace("/dashboard/ratings");
  }, [inWindow, router]);

  // Door check 2: `shouldPrompt === false` with no window/employer reason means
  // this month's rating is already in. Mirrors CompanyRatingFlowScreen.
  useEffect(() => {
    const status = monthly.data;
    if (!status || bounced.current) return;
    if (
      status.shouldPrompt === false &&
      status.reason !== "no_current_employer" &&
      status.reason !== "outside_rating_window"
    ) {
      bounced.current = true;
      toast.info("Already rated", {
        description: "You have already rated your company this month.",
      });
      router.replace("/dashboard/ratings");
    }
  }, [monthly.data, router]);

  if (mePending || (inWindow && monthly.isPending)) {
    return (
      <PageContainer className="max-w-xl">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  if (!companyId) {
    return (
      <PageContainer className="max-w-xl">
        <EmptyState
          icon={Building2}
          title="You do not work for any company yet"
          description="Join your company on Rateo first — once they confirm you, you can rate them every month."
          action={
            <Button asChild size="lg">
              <Link href="/dashboard/request-company">Request to join a company</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-xl">
      <RatingFlow
        criteria={COMPANY_CRITERIA}
        targetId={companyId}
        targetName={company.data?.companyName ?? null}
        category="company_review"
        question="What would you rate your company in terms of"
        successHref="/dashboard"
        backHref="/dashboard/ratings"
        invalidate={[
          ["userReviews"],
          ["companyRatings"],
          ["participationStatus"],
          ["monthlyPrompt"],
        ]}
      />
    </PageContainer>
  );
}

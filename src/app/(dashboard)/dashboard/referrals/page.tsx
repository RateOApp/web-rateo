import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { ReferralHub } from "@/components/referrals/referral-hub";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Invite friends",
};

/**
 * Deliberately in the shared `dashboard/` group, NOT under `(individual)` or
 * `(company)`: every account can refer, and both roles reach the same page
 * from the "Invite friends" row in Settings.
 */
export default function ReferralsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Invite friends"
        description="Share your code and track who joins Rate'O with it."
      />
      <ReferralHub />
    </PageContainer>
  );
}

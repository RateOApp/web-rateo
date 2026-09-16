import type { Metadata } from "next";

import { RegisterCompanyForm } from "@/components/auth/register-company-form";
import { firstParam, normaliseReferralCode } from "@/lib/referral-code";

export const metadata: Metadata = {
  title: "Create a company account",
};

/** `?ref=CODE` from `/join/[code]`, same handoff as the individual page. */
export default async function RegisterCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const ref = normaliseReferralCode(firstParam((await searchParams).ref));
  return <RegisterCompanyForm initialReferralCode={ref} />;
}

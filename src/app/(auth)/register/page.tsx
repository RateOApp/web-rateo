import type { Metadata } from "next";

import { RegisterIndividualForm } from "@/components/auth/register-individual-form";
import { firstParam, normaliseReferralCode } from "@/lib/referral-code";

export const metadata: Metadata = {
  title: "Create an account",
};

/**
 * `?ref=CODE` arrives from `/join/[code]`. It is read here rather than with
 * `useSearchParams` in the form so the client component needs no Suspense
 * boundary, and lands in the form as a normal default value.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const ref = normaliseReferralCode(firstParam((await searchParams).ref));
  return <RegisterIndividualForm initialReferralCode={ref} />;
}

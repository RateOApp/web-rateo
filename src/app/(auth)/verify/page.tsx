import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/clerk";
import { VerifyForm, type VerifyMode } from "@/components/auth/verify-form";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; mode?: string; next?: string }>;
}) {
  const { email, mode, next } = await searchParams;

  // The code is tied to an email address; without one there is nothing to
  // verify - send the visitor back to log in.
  if (!email) redirect("/login");

  const verifyMode: VerifyMode = mode === "reset" ? "reset" : "signup";

  return <VerifyForm email={email} mode={verifyMode} next={safeNextPath(next) ?? undefined} />;
}

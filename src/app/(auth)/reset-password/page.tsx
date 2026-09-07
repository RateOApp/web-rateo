import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; code?: string }>;
}) {
  const { email, code } = await searchParams;

  // Both come from `/verify?mode=reset`; landing here without them means the
  // code was never verified.
  if (!email || !code) redirect("/forgot-password");

  return <ResetPasswordForm email={email} code={code} />;
}

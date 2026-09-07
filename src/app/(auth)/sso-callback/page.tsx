import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SsoCallback } from "@/components/auth/sso-callback";
import { clerkEnabled } from "@/lib/clerk";

export const metadata: Metadata = {
  title: "Finishing sign-in",
  robots: { index: false, follow: false },
};

/**
 * Where Google / Apple / LinkedIn send the browser back to.
 *
 * With Clerk unconfigured nothing can ever land here, so the page redirects
 * instead of rendering a spinner that would never resolve. The work itself is
 * client-side (`SsoCallback`) - it needs the Clerk hooks.
 */
export default function SsoCallbackPage() {
  if (!clerkEnabled) redirect("/login");
  return <SsoCallback />;
}

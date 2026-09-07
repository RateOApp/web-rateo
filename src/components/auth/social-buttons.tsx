"use client";

import { useSignIn } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/nextjs/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  clerkEnabled,
  clerkErrorMessage,
  SSO_STORAGE_KEY,
  type SsoIntent,
} from "@/lib/clerk";

export type SocialButtonsProps = {
  /** Which kind of account to create if this is a first sign-in. */
  role?: "individual" | "company";
  /** Prefills the company name on `/register/company`. */
  companyName?: string;
  /** Where to land after the exchange, when it is not `/setup`. */
  next?: string;
};

type Provider = {
  strategy: OAuthStrategy;
  label: string;
  /** 24x24 single-path glyph, painted with `currentColor`. */
  path: string;
};

const PROVIDERS: Provider[] = [
  {
    strategy: "oauth_google",
    label: "Continue with Google",
    path: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
  },
  {
    strategy: "oauth_apple",
    label: "Continue with Apple",
    path: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
  },
  {
    strategy: "oauth_linkedin_oidc",
    label: "Continue with LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  },
];

/**
 * Google / Apple / LinkedIn sign-in.
 *
 * Renders NOTHING when Clerk is not configured, and the Clerk hooks live in a
 * child component that only mounts in that case - hooks must never run outside
 * `<ClerkProvider>`.
 */
export function SocialButtons(props: SocialButtonsProps) {
  if (!clerkEnabled) return null;
  return <ClerkSocialButtons {...props} />;
}

function ClerkSocialButtons({ role, companyName, next }: SocialButtonsProps) {
  const { signIn } = useSignIn();
  const [pending, setPending] = useState<OAuthStrategy | null>(null);

  async function start(strategy: OAuthStrategy) {
    setPending(strategy);

    // The provider round-trip loses React state, so the intent rides in
    // sessionStorage and `/sso-callback` picks it back up.
    const intent: SsoIntent = { role, companyName, next };
    try {
      window.sessionStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(intent));
    } catch {
      // Private mode / storage disabled: the exchange still works, it just
      // falls back to an individual account and /dashboard.
    }

    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: "/sso-callback",
        redirectCallbackUrl: "/sso-callback",
      });
      if (error) {
        toast.error(clerkErrorMessage(error, "Could not start sign-in. Please try again."));
        setPending(null);
      }
    } catch (err) {
      toast.error(clerkErrorMessage(err, "Could not start sign-in. Please try again."));
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.strategy}
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-2.5 text-sm font-medium text-brand-900"
          disabled={pending !== null}
          onClick={() => void start(provider.strategy)}
        >
          {pending === provider.strategy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d={provider.path} />
            </svg>
          )}
          {provider.label}
        </Button>
      ))}
    </div>
  );
}

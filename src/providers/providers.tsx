import { ClerkProvider } from "@clerk/nextjs";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { clerkEnabled, clerkPublishableKey } from "@/lib/clerk";
import { QueryProvider } from "@/providers/query-provider";

/**
 * App-wide providers, mounted once inside <body> by the root layout.
 *
 * This file is deliberately a SERVER component: `<ClerkProvider>` from
 * `@clerk/nextjs` is an async server component and cannot be imported from a
 * `"use client"` module. Everything it wraps (QueryProvider, TooltipProvider,
 * Toaster) carries its own `"use client"`.
 *
 * Clerk is optional: with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` empty the
 * provider is skipped entirely, no Clerk script is loaded, and the social
 * sign-in buttons render nothing.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const tree = (
    <QueryProvider>
      <TooltipProvider>
        {children}
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </QueryProvider>
  );

  if (!clerkEnabled) return tree;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/login"
      signUpUrl="/register"
      afterSignOutUrl="/login"
    >
      {tree}
    </ClerkProvider>
  );
}

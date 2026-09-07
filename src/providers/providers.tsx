"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";

/**
 * App-wide client providers.
 *
 * Phase 3: wrap everything below in <ClerkProvider> (from `@clerk/nextjs`) so
 * Google / Apple / LinkedIn social sign-in shares the mobile Clerk instance.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        {children}
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </QueryProvider>
  );
}

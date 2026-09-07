"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for every public page. A backend outage must still show
 * branded chrome and a way back, never a raw stack trace.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-white px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent-600"
        >
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="text-xl font-semibold text-brand-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&rsquo;t load this page. It is usually a temporary hiccup — try again in a
          moment.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="lg" className="bg-brand-700 text-white" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/jobs">Back to jobs</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

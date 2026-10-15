"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { useClaimListing } from "@/hooks/use-imported-jobs";
import { getApiErrorMessage } from "@/lib/api/client";

/**
 * Claims the listing for the signed-in company. Only rendered once the page
 * has already confirmed the session belongs to a company - a 403 mid-flight
 * (role changed in another tab, session swapped) still surfaces cleanly via
 * the server's own message.
 */
export function ClaimButton({ token, title }: { token: string; title?: string }) {
  const { mutate, isPending, isSuccess, isError, error, data } = useClaimListing();

  if (isSuccess && data) {
    const linkCls =
      "inline-flex h-11 items-center justify-center rounded-xl bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
    const secondaryCls =
      "rounded text-sm font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
    const converted = data.status === "converted" && Boolean(data.jobId);
    const count = data.interestCount ?? 0;
    const name = title?.trim() || "this listing";

    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-success/10 p-5 text-center sm:p-6">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CheckCircle2 className="size-5" />
        </span>
        {converted ? (
          <>
            <h2 className="text-lg font-bold text-brand-900">You&rsquo;ve claimed {name}</h2>
            <p className="text-sm text-brand-900">
              {count === 0
                ? "No candidates are interested yet. We'll let you know as soon as someone is."
                : `${count} ${count === 1 ? "candidate is" : "candidates are"} already interested. Start reviewing their applications.`}
            </p>
            <Link href={`/dashboard/jobs/${data.jobId}/applicants`} className={`mt-1 ${linkCls}`}>
              Review applications
            </Link>
            <Link href={`/jobs/${data.jobId}`} className={secondaryCls}>
              View job
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-brand-900">Listing claimed</h2>
            <p className="text-sm text-brand-900">
              {data.message || "Complete verification to start reviewing candidates."}
            </p>
            <Link href="/dashboard/kyc" className={`mt-1 ${linkCls}`}>
              Complete verification
            </Link>
            <Link href="/dashboard/jobs" className={secondaryCls}>
              Go to my jobs
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button
        type="button"
        size="lg"
        onClick={() => mutate(token)}
        disabled={isPending}
        aria-busy={isPending}
        className="h-11 w-full gap-2 bg-brand-700 text-sm font-semibold text-white hover:bg-brand-900 sm:w-auto sm:px-8"
      >
        {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isPending ? "Claiming…" : "Claim this listing"}
      </Button>

      {isError ? (
        <FormAlert className="mt-3">
          {getApiErrorMessage(error, "Could not claim this listing. Please try again.")}
        </FormAlert>
      ) : null}
    </div>
  );
}

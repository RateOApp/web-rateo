"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Terminal screen of the rating flow. Copy is verbatim from mobile. */
export function RatingSuccess({ href = "/dashboard" }: { href?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-white px-6 py-16 text-center">
      <CheckCircle2 aria-hidden="true" className="size-24 text-success" strokeWidth={1.25} />
      <p className="text-2xl font-bold text-brand-900">
        Feedback Received
        <br />
        Successfully!
      </p>
      <Button asChild size="lg" className="h-11 w-full max-w-xs text-sm font-semibold">
        <Link href={href}>Go back</Link>
      </Button>
    </div>
  );
}

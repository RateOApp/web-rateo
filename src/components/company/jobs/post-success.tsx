import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

/** The confirmation screen that replaces the form after `POST /jobs` succeeds. */
export function PostSuccess() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-20 items-center justify-center rounded-full bg-brand-50 text-brand-700"
      >
        <Check className="size-10" />
      </span>
      <h2 className="mt-6 text-2xl font-bold text-brand-900">Success!</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your job opening has been posted. Applicants will be able to see your posting.
      </p>
      <Button asChild size="lg" className="mt-8 h-11 w-full max-w-xs bg-brand-700 text-white">
        <Link href="/dashboard/jobs">Done</Link>
      </Button>
    </div>
  );
}

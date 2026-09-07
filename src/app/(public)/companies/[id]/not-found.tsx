import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function CompanyNotFound() {
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-white px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"
        >
          <Building2 className="size-6" />
        </span>
        <h1 className="text-xl font-semibold text-brand-900">
          We couldn&rsquo;t find that company
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The profile may have been removed, or the link may be wrong.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg" className="bg-brand-700 text-white">
            <Link href="/companies">Browse companies</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream-50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <Logo height={28} className="mx-auto" />
        <p className="mt-8 text-5xl font-bold tracking-tight text-brand-900">404</p>
        <h1 className="mt-3 text-xl font-semibold text-brand-900">
          We couldn&rsquo;t find that page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be broken, or the job or company may have been removed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg" className="h-9 px-4">
            <Link href="/jobs">Browse jobs</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-9 px-4">
            <Link href="/companies">Browse companies</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

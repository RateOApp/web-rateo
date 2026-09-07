import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { PublicNavLinks } from "@/components/layout/nav-links";
import type { Session } from "@/lib/session";

/** Sticky marketing/public header. The (public) layout supplies the session. */
export function PublicHeader({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link
          href="/jobs"
          className="shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Rate'O home"
        >
          <Logo height={26} priority />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <PublicNavLinks />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {session ? (
            <Button asChild size="lg" className="h-9 px-4">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="hidden h-9 px-4 sm:inline-flex"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="lg" className="h-9 px-4">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

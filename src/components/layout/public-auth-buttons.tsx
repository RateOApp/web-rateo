"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Public pages that pitch to employers: their header "Sign up" goes to company registration. */
const EMPLOYER_PREFIXES = ["/hire"];

/**
 * Logged-out header actions. A client component only so it can read the
 * pathname; the server header passes `isLoggedIn` from the session.
 */
export function PublicAuthButtons({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  if (isLoggedIn) {
    return (
      <Button asChild size="lg" className="h-9 px-4">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    );
  }

  const forEmployers = EMPLOYER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const signupHref = forEmployers ? "/register/company" : "/register";

  return (
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
        <Link href={signupHref}>Sign up</Link>
      </Button>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">
        Create your Rate&rsquo;O account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find roles that fit and rate the places you have worked.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">Coming in Phase 3.</p>
      <p className="mt-6 text-sm text-muted-foreground">
        Hiring instead?{" "}
        <Link
          href="/register/company"
          className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Create a company account
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

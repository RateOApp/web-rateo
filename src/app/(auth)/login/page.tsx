import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">
        Welcome back to Rate&rsquo;O
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Log in to see your jobs, ratings and messages.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">Coming in Phase 3.</p>
      <p className="mt-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}

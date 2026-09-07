import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cream-50 px-4 py-10">
      <Link
        href="/jobs"
        aria-label="Rate'O home"
        className="mb-6 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Logo height={30} priority />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
        {children}
      </div>
    </main>
  );
}

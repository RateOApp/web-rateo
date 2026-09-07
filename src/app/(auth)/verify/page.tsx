import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default function VerifyPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">Verify your email</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter the code we sent to your inbox.</p>
      <p className="mt-6 text-sm text-muted-foreground">Coming in Phase 3.</p>
    </div>
  );
}

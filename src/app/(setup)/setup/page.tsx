import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finish setting up",
};

export default function SetupPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">Finish setting up</h1>
      <p className="mt-1 text-sm text-muted-foreground">A few details and your account is ready.</p>
      <p className="mt-6 text-sm text-muted-foreground">Setup wizard arrives in Phase 3.</p>
    </div>
  );
}

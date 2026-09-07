import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">Forgot password</h1>
      <p className="mt-1 text-sm text-muted-foreground">We’ll email you a reset code.</p>
      <p className="mt-6 text-sm text-muted-foreground">Coming in Phase 3.</p>
    </div>
  );
}

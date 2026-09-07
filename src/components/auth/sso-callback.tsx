"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { clerkErrorMessage, safeNextPath, SSO_STORAGE_KEY, type SsoIntent } from "@/lib/clerk";

/**
 * Clerk's custom-flow OAuth callback (docs/AUTH_FLOWS.md, step 2-4).
 *
 * The provider sends the browser back here. We finish the Clerk sign-in (or
 * transfer it to a sign-up), then exchange the Clerk session for a Rate'O
 * session through our own route handler, then sign OUT of Clerk - Clerk is
 * only ever an identity provider here, the app runs on the backend JWT.
 *
 * Nothing may navigate before the exchange, so every `finalize` / `setActive`
 * gets `navigate: async () => {}`.
 */
export function SsoCallback() {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!clerk.loaded || hasRun.current) return;
    hasRun.current = true;

    const noNavigate = { navigate: async () => {} };

    async function fail(message: string) {
      toast.error(message);
      try {
        await clerk.signOut();
      } catch {
        // Already signed out, or Clerk is unreachable - go to /login anyway.
      }
      router.replace("/login");
    }

    /** Finishes the Clerk half. Returns an error message, or null on success. */
    async function completeClerkFlow(): Promise<string | null> {
      if (signIn.status === "complete") {
        const { error } = await signIn.finalize(noNavigate);
        return error ? clerkErrorMessage(error, "Could not complete sign-in.") : null;
      }

      const existing = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
      if (existing) {
        await clerk.setActive({ session: existing, ...noNavigate });
        return null;
      }

      // The provider's account exists on the other side of the flow: hand the
      // attempt over rather than starting again.
      if (signUp.isTransferable) {
        const { error } = await signIn.create({ transfer: true });
        if (error) return clerkErrorMessage(error, "Could not complete sign-in.");
        const { error: finalizeError } = await signIn.finalize(noNavigate);
        return finalizeError
          ? clerkErrorMessage(finalizeError, "Could not complete sign-in.")
          : null;
      }

      if (signIn.isTransferable) {
        const { error } = await signUp.create({ transfer: true });
        if (error) return clerkErrorMessage(error, "Could not complete sign-up.");
        const { error: finalizeError } = await signUp.finalize(noNavigate);
        return finalizeError
          ? clerkErrorMessage(finalizeError, "Could not complete sign-up.")
          : null;
      }

      return "Sign-in could not be completed.";
    }

    function readIntent(): SsoIntent {
      try {
        const raw = window.sessionStorage.getItem(SSO_STORAGE_KEY);
        window.sessionStorage.removeItem(SSO_STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return {};
        const { role, companyName, next } = parsed as Record<string, unknown>;
        return {
          role: role === "company" || role === "individual" ? role : undefined,
          companyName: typeof companyName === "string" ? companyName : undefined,
          next: typeof next === "string" ? next : undefined,
        };
      } catch {
        return {};
      }
    }

    async function run() {
      // A password/MFA step means this is not a pure social sign-in; the web
      // app has no UI for it, so hand the user back to the email form.
      if (
        signIn.status === "needs_first_factor" ||
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_new_password"
      ) {
        toast.error("Please sign in with your email and password");
        router.replace("/login");
        return;
      }

      const clerkError = await completeClerkFlow();
      if (clerkError) {
        await fail(clerkError);
        return;
      }

      const intent = readIntent();

      let res: Response;
      try {
        res = await fetch("/api/auth/social-login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ role: intent.role, companyName: intent.companyName }),
        });
      } catch {
        await fail("Network error. Check your connection and try again.");
        return;
      }

      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          typeof (body as { message?: unknown }).message === "string"
            ? (body as { message: string }).message
            : "Could not finish signing you in.";
        await fail(message);
        return;
      }

      const setupCompleted =
        typeof body === "object" && body !== null
          ? (body as { setupCompleted?: unknown }).setupCompleted
          : undefined;

      const target =
        setupCompleted === false ? "/setup" : (safeNextPath(intent.next) ?? "/dashboard");

      // Clerk's job is done; signing out here also performs the navigation.
      await clerk.signOut({ redirectUrl: target });
    }

    void run();
  }, [clerk, router, signIn, signUp]);

  return (
    <AuthCard title="Finishing sign-in…" description="One moment while we set up your session.">
      <div className="flex flex-col items-center gap-4 py-4">
        <Loader2 className="size-8 animate-spin text-brand-700" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" role="status">
          Connecting your account.
        </p>
        <div id="clerk-captcha" />
      </div>
    </AuthCard>
  );
}

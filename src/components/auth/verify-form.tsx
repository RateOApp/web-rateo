"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/form-alert";
import { OtpInput } from "@/components/auth/otp-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { authErrorMessage, errorStatus } from "@/lib/auth-error";
import { hardNavigate } from "@/lib/navigate";
import { authService } from "@/services/auth";

export type VerifyMode = "signup" | "reset";

const CODE_LENGTH = 5;
/** The mobile app blocks "Send code again" for this long after each send. */
const RESEND_SECONDS = 59;

function formatCountdown(seconds: number): string {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function VerifyForm({ email, mode }: { email: string; mode: VerifyMode }) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const complete = code.length === CODE_LENGTH;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complete || submitting) return;

    setServerError(null);
    setSessionExpired(false);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await authService.verifyEmail(code);
        hardNavigate("/setup");
        return;
      }
      await authService.verifyResetCode(email, code);
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
      );
    } catch (err) {
      // In signup mode the call is cookie-authenticated: a 401 means the
      // session cookie is gone, not that the code is wrong.
      if (mode === "signup" && errorStatus(err) === 401) {
        setSessionExpired(true);
      } else {
        setServerError(authErrorMessage(err, "Could not verify that code. Please try again."));
      }
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (secondsLeft > 0 || resending) return;
    setServerError(null);
    setResending(true);
    try {
      if (mode === "signup") await authService.resendVerification();
      else await authService.forgotPassword(email);
      setSecondsLeft(RESEND_SECONDS);
      toast.success("We've sent you a new code.");
    } catch (err) {
      if (mode === "signup" && errorStatus(err) === 401) setSessionExpired(true);
      else setServerError(authErrorMessage(err, "Could not resend the code. Please try again."));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      title="Check your email"
      description={
        <>
          We&rsquo;ve sent a code to{" "}
          <span className="font-medium text-brand-900">{email}</span>
        </>
      }
      footer={
        mode === "reset" ? (
          <>
            Wrong email?{" "}
            <Link
              href="/forgot-password"
              className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Start again
            </Link>
          </>
        ) : null
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <fieldset className="border-0 p-0">
          <legend className="mb-2 text-sm font-medium text-brand-900">
            Enter your 5-digit code
          </legend>
          <OtpInput
            value={code}
            onChange={setCode}
            length={CODE_LENGTH}
            disabled={submitting}
            invalid={serverError ? true : undefined}
            aria-describedby={serverError ? "verify-error" : undefined}
          />
        </fieldset>

        <FormAlert id="verify-error">{serverError}</FormAlert>

        {sessionExpired ? (
          <FormAlert>
            Your session expired, please log in.{" "}
            <Link href="/login" className="font-medium underline underline-offset-4">
              Go to log in
            </Link>
          </FormAlert>
        ) : null}

        <SubmitButton pending={submitting} pendingLabel="Verifying…" disabled={!complete}>
          Verify Code
        </SubmitButton>
      </form>

      <div className="mt-5 text-center text-sm">
        {secondsLeft > 0 ? (
          <p className="text-muted-foreground" aria-live="polite">
            Resend code in{" "}
            <span className="font-medium text-brand-900">{formatCountdown(secondsLeft)}</span>
          </p>
        ) : (
          <>
            <p className="text-muted-foreground">Didn&rsquo;t receive the code?</p>
            <button
              type="button"
              onClick={() => void onResend()}
              disabled={resending}
              className="mt-1 rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              {resending ? "Sending…" : "Send code again"}
            </button>
          </>
        )}
      </div>
    </AuthCard>
  );
}

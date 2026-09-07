"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/form-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import { TextField } from "@/components/auth/text-field";
import { authErrorMessage } from "@/lib/auth-error";
import { authService } from "@/services/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .regex(EMAIL_PATTERN, "Please enter a valid email address."),
});

type ForgotValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    setServerError(null);
    const email = values.email.trim();
    try {
      await authService.forgotPassword(email);
      router.push(`/verify?email=${encodeURIComponent(email)}&mode=reset`);
    } catch (err) {
      setServerError(authErrorMessage(err, "Could not send the code. Please try again."));
    }
  }

  return (
    <AuthCard
      title="Forgot Password?"
      description="Please enter your email address and we'll send you a code."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Back to log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <TextField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Enter your email address"
          error={errors.email?.message}
          {...register("email")}
        />

        <FormAlert>{serverError}</FormAlert>

        <SubmitButton pending={isSubmitting} pendingLabel="Sending code…">
          Reset Password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

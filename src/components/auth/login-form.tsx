"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialSection } from "@/components/auth/social-section";
import { SubmitButton } from "@/components/auth/submit-button";
import { describedBy, FieldShell, TextField } from "@/components/auth/text-field";
import { authErrorMessage } from "@/lib/auth-error";
import { safeNextPath } from "@/lib/clerk";
import { hardNavigate } from "@/lib/navigate";
import { authService } from "@/services/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .regex(EMAIL_PATTERN, "Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm({ next }: { next?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const user = await authService.login({
        email: values.email.trim(),
        password: values.password,
      });
      // Unfinished onboarding wins over any `next`; the wizard sends the user
      // on to /dashboard once it completes.
      const target =
        user.setupCompleted === false ? "/setup" : (safeNextPath(next) ?? "/dashboard");
      hardNavigate(target);
    } catch (err) {
      setServerError(authErrorMessage(err, "Could not log you in. Please try again."));
    }
  }

  return (
    <AuthCard
      title="Welcome back to Rate'O"
      description="Log in to see your jobs, ratings and messages."
      footer={
        <>
          New to Rate&rsquo;O?{" "}
          <Link
            href="/register"
            className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Create an account
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

        <FieldShell id="password" label="Password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy("password", errors.password?.message)}
            {...register("password")}
          />
        </FieldShell>

        <div className="-mt-1 text-right">
          <Link
            href="/forgot-password"
            className="rounded text-sm font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Forgot Password?
          </Link>
        </div>

        <FormAlert>{serverError}</FormAlert>

        <SubmitButton pending={isSubmitting} pendingLabel="Logging in…">
          Log in
        </SubmitButton>
      </form>

      <SocialSection next={next} />
    </AuthCard>
  );
}

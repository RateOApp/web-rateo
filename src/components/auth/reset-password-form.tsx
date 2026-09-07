"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { describedBy, FieldShell } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-error";
import { PASSWORDS_DO_NOT_MATCH, passwordSchema } from "@/lib/password";
import { authService } from "@/services/auth";

const schema = z
  .object({
    password: passwordSchema("Please enter and confirm your new password."),
    confirmPassword: z.string().min(1, "Please enter and confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof schema>;

export function ResetPasswordForm({ email, code }: { email: string; code: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // `useWatch` (not `watch`) so the React Compiler can still memoize this tree.
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: ResetValues) {
    setServerError(null);
    try {
      await authService.resetPassword(email, code, values.password);
      setDone(true);
    } catch (err) {
      setServerError(authErrorMessage(err, "Could not reset your password. Please try again."));
    }
  }

  if (done) {
    return (
      <AuthCard title="Password Changed Successfully!">
        <div className="flex flex-col items-center gap-5 text-center">
          <CheckCircle2 className="size-14 text-success" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            You can now log in with your new password.
          </p>
          <Button asChild className="h-11 w-full text-sm font-semibold">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Create a new password for your account. It must be at least 8 characters."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FieldShell
          id="password"
          label="New password"
          error={errors.password?.message}
          below={<PasswordChecklist id="password-rules" password={password} />}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Enter your new password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy("password", errors.password?.message, "password-rules")}
            {...register("password")}
          />
        </FieldShell>

        <FieldShell
          id="confirmPassword"
          label="Confirm new password"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm your new password"
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
            {...register("confirmPassword")}
          />
        </FieldShell>

        <FormAlert>{serverError}</FormAlert>

        <SubmitButton pending={isSubmitting} pendingLabel="Saving…">
          Reset Password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

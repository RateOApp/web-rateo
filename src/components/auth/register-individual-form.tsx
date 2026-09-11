"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneField } from "@/components/auth/phone-field";
import { RoleSwitch } from "@/components/auth/role-switch";
import { SocialSection } from "@/components/auth/social-section";
import { SubmitButton } from "@/components/auth/submit-button";
import { describedBy, FieldShell, TextField } from "@/components/auth/text-field";
import { authErrorMessage } from "@/lib/auth-error";
import { PASSWORDS_DO_NOT_MATCH, passwordSchema } from "@/lib/password";
import { authService } from "@/services/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Please enter your first and last name."),
    lastName: z.string().trim().min(1, "Please enter your first and last name."),
    email: z
      .string()
      .trim()
      .min(1, "Please enter your email address.")
      .regex(EMAIL_PATTERN, "Please enter a valid email address."),
    phoneNumber: z.string(),
    password: passwordSchema(),
    confirmPassword: z.string().min(1, "Please enter and confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof schema>;

export function RegisterIndividualForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  // `useWatch` (not `watch`) so the React Compiler can still memoize this tree.
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: RegisterValues) {
    setServerError(null);
    const email = values.email.trim();
    try {
      await authService.register({
        role: "individual",
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email,
        password: values.password,
        // Optional: the backend stores '' when no number was typed.
        phoneNumber: values.phoneNumber,
      });
      router.push(`/verify?email=${encodeURIComponent(email)}&mode=signup`);
    } catch (err) {
      setServerError(authErrorMessage(err, "Could not create your account. Please try again."));
    }
  }

  return (
    <AuthCard
      title="Create your Rate'O account"
      description="Find roles that fit and rate the places you have worked."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Log in
          </Link>
        </>
      }
    >
      <RoleSwitch active="individual" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="firstName"
            label="First name"
            autoComplete="given-name"
            placeholder="Enter your first name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <TextField
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            placeholder="Enter your last name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

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

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <FieldShell
              id="phoneNumber"
              label="Phone number"
              optional
              error={errors.phoneNumber?.message}
            >
              <PhoneField
                id="phoneNumber"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-describedby={describedBy("phoneNumber", errors.phoneNumber?.message)}
                aria-invalid={errors.phoneNumber ? true : undefined}
              />
            </FieldShell>
          )}
        />

        <FieldShell
          id="password"
          label="Password"
          error={errors.password?.message}
          below={<PasswordChecklist id="password-rules" password={password} showStrength />}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Enter a strong password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy("password", errors.password?.message, "password-rules")}
            {...register("password")}
          />
        </FieldShell>

        <FieldShell
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm your password"
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
            {...register("confirmPassword")}
          />
        </FieldShell>

        <FormAlert>{serverError}</FormAlert>

        <SubmitButton pending={isSubmitting} pendingLabel="Creating account…">
          Create account
        </SubmitButton>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Terms of Use
          </Link>{" "}
          and{" "}
          <a
            href="https://rateo.ng/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Privacy Policy
          </a>
          .
        </p>
      </form>

      <SocialSection role="individual" />
    </AuthCard>
  );
}

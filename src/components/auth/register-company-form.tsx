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
    companyName: z.string().trim().min(1, "Please enter your company name."),
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

type RegisterCompanyValues = z.infer<typeof schema>;

export function RegisterCompanyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCompanyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  // `useWatch` (not `watch`) so the React Compiler can still memoize this tree.
  const password = useWatch({ control, name: "password" });
  const companyName = useWatch({ control, name: "companyName" });

  async function onSubmit(values: RegisterCompanyValues) {
    setServerError(null);
    const email = values.email.trim();
    try {
      await authService.register({
        role: "company",
        companyName: values.companyName.trim(),
        email,
        password: values.password,
        phoneNumber: values.phoneNumber,
      });
      router.push(`/verify?email=${encodeURIComponent(email)}&mode=signup`);
    } catch (err) {
      setServerError(
        authErrorMessage(err, "Could not register your company. Please try again."),
      );
    }
  }

  return (
    <AuthCard
      title="Create a company account"
      description="Post jobs, review candidates and build your rating."
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
      <RoleSwitch active="company" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 flex flex-col gap-4"
      >
        <TextField
          id="companyName"
          label="Company name"
          autoComplete="organization"
          placeholder="Enter your company name"
          error={errors.companyName?.message}
          {...register("companyName")}
        />

        <TextField
          id="email"
          label="Work email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Enter your company email address"
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

        <SubmitButton pending={isSubmitting} pendingLabel="Registering…">
          Register company
        </SubmitButton>
      </form>

      <SocialSection role="company" companyName={companyName.trim() || undefined} />
    </AuthCard>
  );
}

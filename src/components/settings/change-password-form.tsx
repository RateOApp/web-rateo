"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldShell, describedBy } from "@/components/auth/text-field";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  isPasswordValid,
} from "@/lib/password";
import { authService } from "@/services/auth";

type Alert = { title: string; message: string } | null;

/**
 * `POST /auth/change-password`. Validation order and copy are taken verbatim
 * from `ChangePasswordScreen`; the policy itself lives in `@/lib/password`.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [alert, setAlert] = useState<Alert>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (!current || !next || !confirm) {
      setAlert({ title: "Please fill in all fields", message: "" });
      return;
    }
    if (!isPasswordValid(next)) {
      setAlert({ title: "Weak password", message: PASSWORD_REQUIREMENTS_MESSAGE });
      return;
    }
    if (next === current) {
      setAlert({
        title: "Choose a different password",
        message: "You have used this password before. Please choose a new password.",
      });
      return;
    }
    if (next !== confirm) {
      setAlert({ title: "New passwords do not match", message: "" });
      return;
    }

    setAlert(null);
    setPending(true);
    try {
      await authService.changePassword(current, next);
      toast.success("Your password has been changed.");
      setCurrent("");
      setNext("");
      setConfirm("");
      router.push("/dashboard/settings");
    } catch (error) {
      // `getApiErrorMessage` already folds the server's `errors[]` in.
      setAlert({
        title: "",
        message: getApiErrorMessage(error, "Failed to change password"),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex max-w-md flex-col gap-5 rounded-2xl border border-border bg-white p-5 sm:p-6"
    >
      <FieldShell id="current-password" label="Old password">
        <PasswordInput
          id="current-password"
          name="currentPassword"
          autoComplete="current-password"
          placeholder="Enter old password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </FieldShell>

      <FieldShell
        id="new-password"
        label="New password"
        below={<PasswordChecklist id="new-password-rules" password={next} showStrength />}
      >
        <PasswordInput
          id="new-password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Enter new password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          aria-describedby={describedBy("new-password", undefined, "new-password-rules")}
        />
      </FieldShell>

      <FieldShell id="confirm-password" label="Confirm new password">
        <PasswordInput
          id="confirm-password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </FieldShell>

      {alert ? (
        <FormAlert>
          {alert.title ? <strong className="font-semibold">{alert.title}</strong> : null}
          {alert.title && alert.message ? " — " : null}
          {alert.message}
        </FormAlert>
      ) : null}

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}

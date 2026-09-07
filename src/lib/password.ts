import { z } from 'zod';

/**
 * Password policy, mirrored from the server (`server-rateo/src/utils/passwordValidator.js`)
 * and from the mobile checklist (`app-rateo/src/components/PasswordChecklist.js`).
 *
 * Applied on register / reset-password / change-password. NOT on login - the
 * backend only compares the hash there, and old accounts may predate the rules.
 */

export type PasswordRule = {
  key: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { key: 'length', label: 'At least 8 characters', test: (p) => /.{8,}/.test(p) },
  { key: 'upper', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
];

/** The exact wording the mobile app shows when a rule is unmet. */
export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Please meet all the password requirements listed below the password field.';

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password ?? ''));
}

/**
 * zod field for a NEW password: required, then the full policy.
 * Kept as a factory so each form gets its own instance with its own message.
 */
export function passwordSchema(
  requiredMessage = 'Please enter and confirm your password.',
): z.ZodType<string, string> {
  return z
    .string()
    .min(1, requiredMessage)
    .max(128, 'Password must be at most 128 characters.')
    .refine(isPasswordValid, PASSWORD_REQUIREMENTS_MESSAGE);
}

/** Reported on `confirmPassword` by every form that asks twice. */
export const PASSWORDS_DO_NOT_MATCH = 'Passwords do not match';

export type PasswordStrength = {
  level: 'empty' | 'weak' | 'medium' | 'good';
  label: string;
  /** 0-100, for the meter width. */
  percent: number;
};

/** Same thresholds as the mobile register screen's strength bar. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { level: 'empty', label: '', percent: 0 };
  if (password.length < 6) return { level: 'weak', label: 'Weak', percent: 30 };
  if (password.length < 10) return { level: 'medium', label: 'Medium', percent: 60 };
  return { level: 'good', label: 'Good', percent: 100 };
}

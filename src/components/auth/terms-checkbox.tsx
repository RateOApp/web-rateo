"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PRIVACY_POLICY_URL, TERMS_PATH } from "@/lib/terms";

const LINK_CLASS =
  "rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export const TERMS_REQUIRED_MESSAGE =
  "Please tick the box to agree to the Terms of Service and Privacy Policy.";

/** Required signup checkbox. Controlled by the parent form. */
export function TermsCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="acceptedTerms"
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "acceptedTerms-error" : undefined}
          className="mt-0.5"
        />
        <label htmlFor="acceptedTerms" className="text-sm leading-5 text-muted-foreground">
          I have read and agree to the{" "}
          <a href={TERMS_PATH} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Privacy Policy
          </a>
          .
        </label>
      </div>
      {error ? (
        <p id="acceptedTerms-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { BadgeCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { describedBy, FieldShell } from "@/components/auth/text-field";
import { Input } from "@/components/ui/input";
import { useReferralCodeLookup } from "@/hooks/use-referrals";
import {
  isLookupableReferralCode,
  MAX_REFERRAL_CODE_LENGTH,
  normaliseReferralCode,
} from "@/lib/referral-code";

const FIELD_ID = "referralCode";
const HINT_ID = "referralCode-hint";
const DEBOUNCE_MS = 500;

type ReferralCodeFieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  /** The live form value, from `useWatch` — drives the debounced lookup. */
  value?: string;
  error?: string;
};

/**
 * Optional "Referral code" input for the register forms.
 *
 * The lookup is decoration only: it is debounced, never retried, and its
 * result never gates the submit button. A code the backend does not recognise
 * is still sent — the server silently skips the referral rather than failing
 * the signup (business rule 1).
 */
export function ReferralCodeField({ value, error, ...props }: ReferralCodeFieldProps) {
  const normalised = normaliseReferralCode(value);
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(normalised), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [normalised]);

  // Only trust the result once the debounce has caught up with what is typed.
  const settled = debounced === normalised && isLookupableReferralCode(normalised);
  const { data, isFetching, isError } = useReferralCodeLookup(debounced);

  let hint: React.ReactNode = null;
  if (settled && isFetching) {
    hint = (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        Checking code…
      </span>
    );
  } else if (settled && !isError && data?.valid) {
    hint = (
      <span className="flex items-center gap-1.5 text-xs font-medium text-success">
        <BadgeCheck aria-hidden="true" className="size-3.5" />
        Referred by {data.referrerName?.trim() || "a Rate'O member"}
      </span>
    );
  } else if (settled && !isError && data && !data.valid) {
    hint = (
      <span className="text-xs text-muted-foreground">
        Code not found — you can still sign up.
      </span>
    );
  }

  return (
    <FieldShell
      id={FIELD_ID}
      label="Referral code"
      optional
      error={error}
      below={
        hint ? (
          <p id={HINT_ID} role="status">
            {hint}
          </p>
        ) : null
      }
    >
      <Input
        id={FIELD_ID}
        {...props}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={MAX_REFERRAL_CODE_LENGTH}
        placeholder="Enter an invite code"
        className="h-11 uppercase"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(FIELD_ID, error, hint ? HINT_ID : undefined)}
      />
    </FieldShell>
  );
}

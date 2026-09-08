'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { FormAlert } from '@/components/auth/form-alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getApiErrorMessage } from '@/lib/api/errors';
import { kycService } from '@/services/kyc';
import type { VerifierType } from '@/types/company';

/** Value strings are the backend contract (`VERIFIER_TYPES` in userController). */
const VERIFIER_TYPES: { value: VerifierType; label: string }[] = [
  { value: 'owner', label: 'I am the business owner' },
  { value: 'hr', label: 'I am HR at this company' },
  { value: 'representative', label: 'I am an authorized representative of the owner' },
  { value: 'other', label: 'Other' },
];

/** Exact legal text the user attests to. Do not reword without legal sign-off. */
const ATTESTATION_TEXT =
  'I confirm that I am the owner of this business, or that I am duly authorized by the owner or management to verify this business on Rateo. I confirm that the information I provide is true and accurate, and I understand that Rateo relies on this declaration in verifying the business. I accept responsibility for this verification and understand that false declarations may result in removal of the business profile and suspension of my account.';

/** Sensible prefill for the free-text role, per declared relationship. */
const ROLE_PREFILL: Partial<Record<VerifierType, string>> = { owner: 'Owner', hr: 'HR' };

/**
 * The authorization gate in front of business KYC.
 *
 * A company profile is a public reputation record, so before anyone can verify
 * one, Rateo needs a named human accepting responsibility for the claim. The
 * backend enforces the same thing independently (400 `ATTESTATION_REQUIRED` on
 * both verification paths) - this screen exists so the user meets the gate as a
 * deliberate declaration rather than as an error.
 */
export function AttestationStep({ onAccepted }: { onAccepted: () => void }) {
  const [verifierType, setVerifierType] = useState<VerifierType | ''>('');
  const [verifierTypeOther, setVerifierTypeOther] = useState('');
  const [role, setRole] = useState('');
  // Never overwrite something the user typed with a prefill.
  const [roleEdited, setRoleEdited] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    Boolean(verifierType) &&
    role.trim().length > 0 &&
    (verifierType !== 'other' || verifierTypeOther.trim().length > 0) &&
    accepted;

  function pickType(value: string) {
    const next = value as VerifierType;
    setVerifierType(next);
    if (next !== 'other') setVerifierTypeOther('');
    if (!roleEdited) setRole(ROLE_PREFILL[next] ?? '');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await kycService.submitAttestation({
        verifierType: verifierType as VerifierType,
        ...(verifierType === 'other'
          ? { verifierTypeOther: verifierTypeOther.trim() }
          : {}),
        role: role.trim(),
        accepted: true,
      });
      onAccepted();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to save authorization'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-brand-900">Business verification authorization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Before you verify this business, Rateo needs to know who you are and that you&rsquo;re
          allowed to do it on the company&rsquo;s behalf.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <p id="verifier-type-label" className="text-sm font-medium text-brand-900">
          Who is verifying this business?
        </p>

        <RadioGroup
          value={verifierType}
          onValueChange={pickType}
          disabled={submitting}
          aria-labelledby="verifier-type-label"
          className="gap-2"
        >
          {VERIFIER_TYPES.map((option) => (
            <Label
              key={option.value}
              htmlFor={`verifier-${option.value}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm font-normal text-brand-900 transition-colors hover:bg-muted has-data-checked:border-brand-700 has-data-checked:bg-brand-50"
            >
              <RadioGroupItem id={`verifier-${option.value}`} value={option.value} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>

        {verifierType === 'other' ? (
          <Input
            value={verifierTypeOther}
            disabled={submitting}
            aria-label="Describe your relationship to the business"
            placeholder="Describe your relationship to the business"
            onChange={(event) => setVerifierTypeOther(event.target.value)}
            className="h-11"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="verifier-role" className="text-brand-900">
          Your role / position
        </Label>
        <Input
          id="verifier-role"
          value={role}
          maxLength={100}
          disabled={submitting}
          placeholder="e.g. Owner, HR Manager, Director"
          onChange={(event) => {
            setRoleEdited(true);
            setRole(event.target.value);
          }}
          className="h-11"
        />
      </div>

      {/* Scrollable so the declaration is presented in full rather than
          summarised - it is the thing being agreed to. */}
      <div className="max-h-48 overflow-y-auto rounded-2xl border border-border bg-muted/40 p-4">
        <p className="text-sm leading-relaxed text-brand-900">{ATTESTATION_TEXT}</p>
      </div>

      <Label
        htmlFor="attestation-accept"
        className="flex cursor-pointer items-start gap-3 text-sm font-normal text-brand-900"
      >
        <Checkbox
          id="attestation-accept"
          checked={accepted}
          disabled={submitting}
          onCheckedChange={(checked) => setAccepted(checked === true)}
        />
        I have read and agree to the above
      </Label>

      <FormAlert>{error}</FormAlert>

      <Button
        type="submit"
        className="h-11 w-full bg-brand-700 text-white"
        disabled={!ready || submitting}
      >
        {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
        Continue
      </Button>
    </form>
  );
}

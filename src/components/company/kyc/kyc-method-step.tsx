'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { FormAlert } from '@/components/auth/form-alert';
import { DocumentField } from '@/components/company/kyc/kyc-address-step';
import { SelfieCapture } from '@/components/profile/selfie-capture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type MethodValues = {
  cacNumber: string;
  cacCertificate: string | null;
  attesterSelfieUrl: string | null;
};

type KycMethodStepProps = {
  values: MethodValues;
  onChange: (patch: Partial<MethodValues>) => void;
  onSubmit: () => void;
  submitting: boolean;
  /** Server error from the manual submit, shown verbatim. */
  error: string | null;
  /** Set when the server answered `ATTESTER_SELFIE_REQUIRED`. */
  selfieRejected?: boolean;
};

/**
 * How to prove the business: instantly through Dojah, or by team review.
 *
 * Dojah is offered first because it is minutes rather than a day, but the
 * manual path is never removed - CAC records that Dojah cannot resolve are
 * common enough that a dead end here would strand real companies. The live
 * selfie is required on the manual path specifically: it ties a face to the
 * authorization declaration, which a certificate upload alone cannot do.
 */
export function KycMethodStep({
  values,
  onChange,
  onSubmit,
  submitting,
  error,
  selfieRejected,
}: KycMethodStepProps) {
  const [showManual, setShowManual] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!values.cacNumber.trim() || !values.cacCertificate || !values.attesterSelfieUrl) {
      setLocalError('Please provide your CAC details and take a live selfie');
      return;
    }
    setLocalError(null);
    onSubmit();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-brand-900">Get verified badge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please provide the following to get verified.
        </p>
      </div>

      <Button asChild className="h-11 w-full bg-brand-700 text-white">
        <Link href="/dashboard/kyc/dojah?flow=business">Verify instantly</Link>
      </Button>

      {showManual ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
        >
          <p className="text-base font-semibold text-brand-900">Verify with team review</p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cac-number" className="text-brand-900">
              CAC registration number
            </Label>
            <Input
              id="cac-number"
              value={values.cacNumber}
              inputMode="numeric"
              autoComplete="off"
              maxLength={9}
              disabled={submitting}
              placeholder="Enter CAC number"
              onChange={(event) =>
                onChange({ cacNumber: event.target.value.replace(/\D/g, '').slice(0, 9) })
              }
              className="h-11"
            />
          </div>

          <DocumentField
            id="cac-certificate"
            label="CAC certificate (png, pdf, Jpg. Max 5Mb)"
            value={values.cacCertificate}
            disabled={submitting}
            onChange={(url) => onChange({ cacCertificate: url })}
          />

          <div
            className={cn(
              'flex flex-col gap-1.5',
              // The server rejects a submission with no verifier selfie by code;
              // point at the field rather than only repeating the message.
              selfieRejected && !values.attesterSelfieUrl
                ? 'rounded-xl border border-destructive/40 bg-destructive/5 p-3'
                : null,
            )}
          >
            <Label className="text-brand-900">Live selfie of you (the person verifying)</Label>
            <p className="text-xs text-muted-foreground">
              Front camera only — this confirms who submitted this verification.
            </p>
            <SelfieCapture
              value={values.attesterSelfieUrl}
              onChange={(url) => onChange({ attesterSelfieUrl: url })}
              disabled={submitting}
            />
          </div>

          <FormAlert>{localError ?? error}</FormAlert>

          <Button
            type="submit"
            className="h-11 w-full bg-brand-700 text-white"
            disabled={submitting}
          >
            {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            Complete Verification
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="self-center text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          Verify with team review instead
        </button>
      )}
    </div>
  );
}

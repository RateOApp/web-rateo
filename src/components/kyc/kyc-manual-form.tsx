'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { FormAlert } from '@/components/auth/form-alert';
import { SelfieCapture } from '@/components/profile/selfie-capture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/errors';
import { kycService } from '@/services/kyc';

const NIN_PATTERN = /^\d{11}$/;

/**
 * Manual (team review) KYC: NIN + a live selfie.
 *
 * The selfie is uploaded by `SelfieCapture` before submit, so this only ever
 * sends hosted URLs. `POST /users/kyc` flips `kycStatus` to `pending` and
 * notifies the admins; nothing here can mark an account verified.
 */
export function KycManualForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [nin, setNin] = useState('');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!NIN_PATTERN.test(nin) || !selfieUrl) {
      setError('Please enter a valid 11-digit NIN and take a live selfie');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await kycService.submitManual({ nin, selfieUrl });
      onSubmitted();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Verification failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
    >
      <div>
        <p className="text-base font-semibold text-brand-900">Manual verification</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please provide the following to get verified.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kyc-nin" className="text-brand-900">
          NIN
        </Label>
        <Input
          id="kyc-nin"
          value={nin}
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          placeholder="3462789465"
          disabled={submitting}
          aria-invalid={nin.length > 0 && !NIN_PATTERN.test(nin) ? true : undefined}
          onChange={(event) => setNin(event.target.value.replace(/\D/g, '').slice(0, 11))}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-brand-900">Live selfie</Label>
        <SelfieCapture value={selfieUrl} onChange={setSelfieUrl} disabled={submitting} />
      </div>

      <FormAlert>{error}</FormAlert>

      <Button type="submit" className="h-11 bg-brand-700 text-white" disabled={submitting}>
        {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
        Complete verification
      </Button>
    </form>
  );
}

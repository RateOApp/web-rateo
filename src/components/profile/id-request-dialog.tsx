'use client';

import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { SelfieCapture } from '@/components/profile/selfie-capture';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/errors';
import { usersService } from '@/services/users';

export type IdRequestKind = 'email' | 'phone';

const LABEL: Record<IdRequestKind, string> = {
  email: 'email address',
  phone: 'phone number',
};

type IdRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: IdRequestKind;
  /** The value being changed, shown in the copy. Always the viewer's own. */
  currentValue?: string;
  /** Fired after a successful request so the parent can refetch `['me']`. */
  onSubmitted?: () => void;
};

const NIN_PATTERN = /^\d{11}$/;

/**
 * The admin-gated path for changing a locked field.
 *
 * Both email and phone use it, and both require the same proof of identity: an
 * 11-digit NIN AND a live selfie already uploaded to Cloudinary. The backend
 * rejects the request otherwise, so the submit button gates on exactly that.
 *
 * The body only exists while the dialog is open, so a half-finished identity
 * check can never carry over into the next attempt.
 */
export function IdRequestDialog({ open, onOpenChange, ...rest }: IdRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <IdRequestBody onOpenChange={onOpenChange} {...rest} /> : null}
    </Dialog>
  );
}

function IdRequestBody({
  onOpenChange,
  kind,
  currentValue,
  onSubmitted,
}: Omit<IdRequestDialogProps, 'open'>) {
  const [nin, setNin] = useState('');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = LABEL[kind];
  const ninValid = NIN_PATTERN.test(nin);
  const canSubmit = ninValid && Boolean(selfieUrl) && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !selfieUrl) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = { nin, selfieUrl };
      if (kind === 'email') await usersService.requestEmailEdit(payload);
      else await usersService.requestPhoneEdit(payload);

      onOpenChange(false);
      toast.success('Request sent', {
        description: `An admin will review your request. You'll be able to edit your ${label} once it's approved.`,
      });
      onSubmitted?.();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to submit the request'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <span
          aria-hidden="true"
          className="mb-1 flex size-11 items-center justify-center rounded-full bg-accent-50 text-accent-600"
        >
          <Lock className="size-5" />
        </span>
        <DialogTitle>Request Edit Access</DialogTitle>
        <DialogDescription>
          To update your {label}
          {currentValue ? ` (${currentValue})` : ''}, you must first request access. An
          administrator will review your request and you&rsquo;ll be notified once it&rsquo;s
          approved.
        </DialogDescription>
      </DialogHeader>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-border bg-muted/40 p-3">
          <p className="text-sm font-semibold text-brand-900">Verify your identity</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your NIN and take a live photo to verify your identity. Both are required.
          </p>

          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor="id-request-nin" className="text-brand-900">
              NIN
            </Label>
            <Input
              id="id-request-nin"
              value={nin}
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              placeholder="Enter your 11-digit NIN"
              disabled={submitting}
              aria-invalid={nin.length > 0 && !ninValid ? true : undefined}
              onChange={(event) => setNin(event.target.value.replace(/\D/g, '').slice(0, 11))}
              className="h-11 bg-card"
            />
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <Label className="text-brand-900">Live photo</Label>
            <SelfieCapture value={selfieUrl} onChange={setSelfieUrl} disabled={submitting} />
          </div>
        </div>

        <FormAlert>{error}</FormAlert>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="h-11 bg-brand-700 text-white" disabled={!canSubmit}>
            {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            Submit Request
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

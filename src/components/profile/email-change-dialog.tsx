'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

import { FormAlert } from '@/components/auth/form-alert';
import { OtpInput } from '@/components/auth/otp-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api/errors';
import { usersService } from '@/services/users';

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'choose' | 'verifyOld' | 'newEmail' | 'verifyNew' | 'done';

type EmailChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The viewer's own address - never another user's. */
  currentEmail: string;
  /** Option 2: hand off to the admin NIN + selfie request. */
  onContactAdmin: () => void;
  /** Fired once the server has switched the address. */
  onChanged: (email: string) => void;
};

/**
 * Self-service email change: verify the current address, then the new one.
 *
 * `start` -> `verify-old` -> `send-new` -> `verify-new`; the server switches
 * the address on the final step and echoes it back, so nothing here has to
 * trust local state. One dialog, internal steps, mirroring
 * `EmailChangeOtpModal.js`.
 *
 * The body is mounted only while the dialog is open, so every visit starts on
 * the chooser with empty codes - no reset effect, and no chance of a stale
 * half-finished wizard reappearing.
 */
export function EmailChangeDialog({ open, onOpenChange, ...rest }: EmailChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <EmailChangeBody onOpenChange={onOpenChange} {...rest} /> : null}
    </Dialog>
  );
}

function EmailChangeBody({
  onOpenChange,
  currentEmail,
  onContactAdmin,
  onChanged,
}: Omit<EmailChangeDialogProps, 'open'>) {
  const [step, setStep] = useState<Step>('choose');
  const [oldCode, setOldCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Entering `verifyOld` sends the first code exactly once, even under Strict
  // Mode's double effect - a second send would trip the server cooldown.
  const oldStarted = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (step !== 'verifyOld' || oldStarted.current) return;
    oldStarted.current = true;
    setSubmitting(true);
    usersService
      .startEmailChange()
      .then(() => setSecondsLeft(RESEND_SECONDS))
      .catch((caught: unknown) => {
        oldStarted.current = false;
        setError(getApiErrorMessage(caught, 'Failed to send verification code'));
      })
      .finally(() => setSubmitting(false));
  }, [step]);

  async function resend(send: () => Promise<unknown>, clear: () => void) {
    if (secondsLeft > 0 || resending) return;
    setError(null);
    setResending(true);
    try {
      await send();
      setSecondsLeft(RESEND_SECONDS);
      clear();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to send verification code'));
    } finally {
      setResending(false);
    }
  }

  async function verifyOld() {
    if (oldCode.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await usersService.verifyOldEmailOtp(oldCode);
      setSecondsLeft(0);
      setStep('newEmail');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Invalid or expired code'));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendNew() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await usersService.sendNewEmailOtp(trimmed);
      setNewEmail(trimmed);
      setNewCode('');
      setSecondsLeft(RESEND_SECONDS);
      setStep('verifyNew');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to send verification code'));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyNew() {
    if (newCode.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await usersService.verifyNewEmailOtp(newCode);
      const finalEmail = result?.email || newEmail;
      setConfirmedEmail(finalEmail);
      setSecondsLeft(0);
      setStep('done');
      onChanged(finalEmail);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Invalid or expired code'));
    } finally {
      setSubmitting(false);
    }
  }

  function renderResend(send: () => Promise<unknown>, clear: () => void) {
    return (
      <button
        type="button"
        disabled={secondsLeft > 0 || resending}
        onClick={() => void resend(send, clear)}
        className="self-center text-sm font-semibold text-brand-700 underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
      >
        {resending
          ? 'Sending…'
          : secondsLeft > 0
            ? `Resend code in ${secondsLeft}s`
            : 'Resend code'}
      </button>
    );
  }

  const titles: Record<Step, string> = {
    choose: 'Edit your email',
    verifyOld: 'Verify current email',
    newEmail: 'Your new email',
    verifyNew: 'Confirm new email',
    done: 'Email updated',
  };

  const descriptions: Record<Step, string> = {
    choose: 'How would you like to update your email address?',
    verifyOld: `Enter the 6-digit code we sent to ${currentEmail}`,
    newEmail: "Enter the email address you'd like to use. We'll send a code to confirm it.",
    verifyNew: `Enter the 6-digit code we sent to ${newEmail}`,
    done: `Your email is now ${confirmedEmail}`,
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        {step === 'done' ? (
          <span
            aria-hidden="true"
            className="mb-1 flex size-11 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <CheckCircle2 className="size-6" />
          </span>
        ) : step !== 'choose' ? (
          <span
            aria-hidden="true"
            className="mb-1 flex size-11 items-center justify-center rounded-full bg-accent-50 text-accent-600"
          >
            <Lock className="size-5" />
          </span>
        ) : null}
        <DialogTitle>{titles[step]}</DialogTitle>
        <DialogDescription>{descriptions[step]}</DialogDescription>
      </DialogHeader>

      {step === 'choose' ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep('verifyOld');
            }}
            className="flex items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-muted"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600"
            >
              <Mail className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-brand-900">Send OTP and edit</span>
              <span className="block text-xs text-muted-foreground">
                We&rsquo;ll verify your current email, then your new one
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={onContactAdmin}
            className="flex items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-muted"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600"
            >
              <ShieldCheck className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-brand-900">
                Contact admin to request to edit
              </span>
              <span className="block text-xs text-muted-foreground">
                Use this if you no longer have access to your current email
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <Button variant="ghost" className="h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      ) : null}

      {step === 'verifyOld' ? (
        <div className="flex flex-col gap-4">
          <OtpInput
            value={oldCode}
            onChange={setOldCode}
            length={CODE_LENGTH}
            disabled={submitting}
            invalid={Boolean(error)}
          />
          {renderResend(
            () => usersService.startEmailChange(),
            () => setOldCode(''),
          )}
          <FormAlert>{error}</FormAlert>
          <div className="flex flex-col gap-2">
            <Button
              className="h-11 bg-brand-700 text-white"
              disabled={submitting}
              onClick={() => void verifyOld()}
            >
              {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Verify
            </Button>
            <Button
              variant="ghost"
              className="h-11"
              disabled={submitting}
              onClick={() => {
                setError(null);
                setStep('choose');
              }}
            >
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'newEmail' ? (
        <div className="flex flex-col gap-4">
          <Input
            type="email"
            autoComplete="email"
            placeholder="newemail@example.com"
            value={newEmail}
            disabled={submitting}
            aria-label="New email address"
            onChange={(event) => setNewEmail(event.target.value)}
            className="h-11"
          />
          <FormAlert>{error}</FormAlert>
          <div className="flex flex-col gap-2">
            <Button
              className="h-11 bg-brand-700 text-white"
              disabled={submitting}
              onClick={() => void sendNew()}
            >
              {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Send code
            </Button>
            <Button
              variant="ghost"
              className="h-11"
              disabled={submitting}
              onClick={() => {
                setError(null);
                setStep('verifyOld');
              }}
            >
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'verifyNew' ? (
        <div className="flex flex-col gap-4">
          <OtpInput
            value={newCode}
            onChange={setNewCode}
            length={CODE_LENGTH}
            disabled={submitting}
            invalid={Boolean(error)}
          />
          {renderResend(
            () => usersService.sendNewEmailOtp(newEmail),
            () => setNewCode(''),
          )}
          <FormAlert>{error}</FormAlert>
          <div className="flex flex-col gap-2">
            <Button
              className="h-11 bg-brand-700 text-white"
              disabled={submitting}
              onClick={() => void verifyNew()}
            >
              {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Confirm change
            </Button>
            <Button
              variant="ghost"
              className="h-11"
              disabled={submitting}
              onClick={() => {
                setError(null);
                setStep('newEmail');
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'done' ? (
        <Button className="h-11 bg-brand-700 text-white" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      ) : null}
    </DialogContent>
  );
}

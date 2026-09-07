'use client';

import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { KycStatus } from '@/types/api';

type KycStatusCardProps = {
  status: Exclude<KycStatus, 'none'>;
  /** Reviewer note on a rejection, when there is one. */
  adminComment?: string | null;
  /** Rejected only: restart the flow in place. */
  onRetry?: () => void;
};

/**
 * The three terminal KYC states. Anything else means "not submitted", which is
 * the intro's job rather than this card's.
 */
export function KycStatusCard({ status, adminComment, onRetry }: KycStatusCardProps) {
  if (status === 'verified') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <CheckCircle2 className="size-7" />
        </span>
        <p className="text-lg font-semibold text-brand-900">You are verified ✓</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your account has already been verified — no need to submit KYC again.
        </p>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent-50 text-accent-600"
        >
          <Clock className="size-7" />
        </span>
        <p className="text-lg font-semibold text-brand-900">Verification pending</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">This usually takes 24 hours</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-destructive/30 bg-card px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <ShieldAlert className="size-7" />
      </span>
      <p className="text-lg font-semibold text-brand-900">Verification Rejected</p>
      {adminComment ? (
        <p className="mt-2 max-w-sm rounded-xl bg-muted px-3 py-2 text-sm text-brand-900">
          {adminComment}
        </p>
      ) : (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your documents were not approved. Please submit them again.
        </p>
      )}
      {onRetry ? (
        <Button className="mt-5 h-11 bg-brand-700 text-white" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

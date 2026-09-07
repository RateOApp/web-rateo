'use client';

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type WizardShellProps = {
  /** 1-based position of the visible step. */
  step: number;
  /** Total number of steps for this account (company setup varies by 1). */
  total: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Omitted on the first step, which hides the Back button. */
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  /** Shows the full-card "Setting up your account" overlay and locks input. */
  busy?: boolean;
  /** Lighter variant: spinner inside Continue, no overlay (e.g. logo upload). */
  continueBusy?: boolean;
};

/**
 * The card every wizard step renders into: progress, heading, body, footer.
 * Steps own their state and validation; this only draws the frame, so the two
 * wizards stay visually identical without sharing any logic.
 */
export function WizardShell({
  step,
  total,
  title,
  description,
  children,
  onBack,
  onContinue,
  continueLabel,
  busy = false,
  continueBusy = false,
}: WizardShellProps) {
  const isLast = step >= total;
  const percent = Math.round((step / total) * 100);

  // No `overflow-hidden` on the card: the suggestion lists are absolutely
  // positioned and have to be allowed to spill past its edge.
  return (
    <div className="relative w-full rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Step {step} of {total}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{percent}%</p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-brand-50"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step}
          aria-label={`Setup progress: step ${step} of ${total}`}
        >
          <div
            className="h-full rounded-full bg-brand-700 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">{title}</h1>
      {description ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      ) : null}

      <div className="mt-6">{children}</div>

      <div
        className={cn(
          'mt-8 flex items-center gap-3',
          onBack ? 'justify-between' : 'justify-end',
        )}
      >
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-11 px-3 text-brand-900"
            onClick={onBack}
            disabled={busy || continueBusy}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-11 min-w-32 bg-brand-700 px-5 text-white"
          onClick={onContinue}
          disabled={busy || continueBusy}
        >
          {continueBusy ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : null}
          {continueLabel ?? (isLast ? 'Finish' : 'Continue')}
          {continueBusy ? null : <ArrowRight aria-hidden="true" />}
        </Button>
      </div>

      {busy ? (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card/95 px-6 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 aria-hidden="true" className="size-8 animate-spin text-brand-700" />
          <p className="text-sm font-semibold text-brand-900">Setting up your account&hellip;</p>
          <p className="text-xs text-muted-foreground">This may take a moment</p>
        </div>
      ) : null}
    </div>
  );
}

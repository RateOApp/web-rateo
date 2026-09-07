'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Info } from 'lucide-react';

import { KycManualForm } from '@/components/kyc/kyc-manual-form';
import { KycStatusCard } from '@/components/kyc/kyc-status-card';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/use-me';
import { kycAdminComment } from '@/services/kyc';
import type { KycStatus, User } from '@/types/api';

type Step = 'intro' | 'verify' | 'done';

/**
 * Individual KYC.
 *
 * Verified and pending accounts have nothing to submit, so they get the status
 * card instead of the flow. A rejected account sees why and can restart in
 * place. Everyone else walks intro -> verify -> done, where "verify" offers the
 * instant Dojah path first and reveals the team-review form on request.
 */
export function KycIntro({ user: initialUser }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useMe();
  const user = data ?? initialUser;

  const [step, setStep] = useState<Step>('intro');
  const [showManual, setShowManual] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const status: KycStatus = user.kycStatus ?? 'none';

  if (step !== 'done' && (status === 'verified' || status === 'pending')) {
    return <KycStatusCard status={status} />;
  }

  if (step !== 'done' && status === 'rejected' && !retrying) {
    return (
      <KycStatusCard
        status="rejected"
        adminComment={kycAdminComment(user)}
        onRetry={() => {
          setRetrying(true);
          setStep('verify');
        }}
      />
    );
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent-50 text-accent-600"
        >
          <Info className="size-7" />
        </span>
        <p className="text-lg font-semibold text-brand-900">
          Thank you! We will verify and get back to you.
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Our team will go through the details you&rsquo;ve provided. This usually takes 24hours.
        </p>
        <Button
          className="mt-6 h-11 w-full max-w-xs bg-brand-700 text-white"
          onClick={() => router.push('/dashboard/profile')}
        >
          Done
        </Button>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900">Get verified badge</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify your identity with NIN + a live selfie in seconds.
          </p>
        </div>

        <Button asChild className="h-11 w-full bg-brand-700 text-white">
          <Link href="/dashboard/kyc/dojah">Verify instantly</Link>
        </Button>

        {showManual ? (
          <KycManualForm
            onSubmitted={() => {
              // The server has already set `pending`; refetch rather than
              // writing the status locally.
              void queryClient.invalidateQueries({ queryKey: ['me'] });
              router.refresh();
              setStep('done');
            }}
          />
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-brand-900">Complete your KYC</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your identity to keep Rateo safe and trusted. Once approved, you&rsquo;ll get the
          verified badge and can apply for jobs, message employers, and rate your workplace.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-brand-900">Get the verified badge</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Undone
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-brand-900">Requirements</p>
        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
          <li>• National Identity Number (NIN)</li>
          <li>• A live selfie (front camera)</li>
        </ul>
        <Button
          className="mt-5 h-11 w-full bg-brand-700 text-white sm:w-auto"
          onClick={() => setStep('verify')}
        >
          Let&rsquo;s go
          <ArrowRight aria-hidden="true" />
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-brand-50 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-brand-900">Become a Rateo OG</h3>
        <p className="mt-4 text-sm font-medium text-brand-900">Requirements</p>
        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
          <li>• Get verified badge</li>
          <li>• Use the app Actively for six (6) months</li>
        </ul>
      </section>
    </div>
  );
}

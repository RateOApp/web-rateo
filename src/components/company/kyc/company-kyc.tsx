'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Info } from 'lucide-react';

import { AttestationStep } from '@/components/company/kyc/attestation-step';
import {
  KycAddressStep,
  type AddressValues,
} from '@/components/company/kyc/kyc-address-step';
import { KycMethodStep, type MethodValues } from '@/components/company/kyc/kyc-method-step';
import { KycStatusCard } from '@/components/kyc/kyc-status-card';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/use-me';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  isAttestationRequired,
  isAttesterSelfieRequired,
  kycAdminComment,
  kycService,
} from '@/services/kyc';
import { attestationKnownMissing } from '@/types/company';
import type { KycStatus, User } from '@/types/api';

type Step = 'authorization' | 'intro' | 'address' | 'method' | 'done';

/**
 * Business KYC.
 *
 * Order is authorization -> intro -> address -> method, and the authorization
 * step is the only one that can be skipped: the backend gates both verification
 * paths on it but the user document does not always report whether it was
 * signed. So the flow is optimistic - it starts at the intro unless the
 * document explicitly says the attestation is unaccepted - and treats a
 * `400 ATTESTATION_REQUIRED` from the submit as the authoritative answer,
 * dropping the user back onto the declaration with their form intact.
 *
 * Form state lives here rather than in the steps so stepping back and forth
 * never loses an uploaded document, and so the final `POST /users/kyc` can send
 * both halves in the single request the controller expects.
 */
export function CompanyKyc({ user: initialUser }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useMe();
  const user = data ?? initialUser;

  const [step, setStep] = useState<Step>(() =>
    attestationKnownMissing(user) ? 'authorization' : 'intro',
  );
  const [retrying, setRetrying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfieRejected, setSelfieRejected] = useState(false);

  const [address, setAddress] = useState<AddressValues>({
    // Companies store their address in `location`; the setup wizard wrote it.
    address: user.location ?? '',
    state: '',
    city: '',
    proofOfAddress: null,
  });
  const [method, setMethod] = useState<MethodValues>({
    cacNumber: '',
    cacCertificate: null,
    attesterSelfieUrl: null,
  });

  const status: KycStatus = user.kycStatus ?? 'none';

  async function handleSubmit() {
    if (
      submitting ||
      !address.proofOfAddress ||
      !method.cacCertificate ||
      !method.attesterSelfieUrl
    ) {
      return;
    }

    setError(null);
    setSelfieRejected(false);
    setSubmitting(true);
    try {
      await kycService.submitBusinessManual({
        address: address.address.trim(),
        state: address.state.trim(),
        city: address.city.trim(),
        proofOfAddress: address.proofOfAddress,
        cacNumber: method.cacNumber.trim(),
        cacCertificate: method.cacCertificate,
        attesterSelfieUrl: method.attesterSelfieUrl,
      });
      // The server has already set `pending`; refetch rather than writing the
      // status locally.
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.refresh();
      setStep('done');
    } catch (caught) {
      if (isAttestationRequired(caught)) {
        // The declaration is missing after all - back to the gate, form kept.
        setStep('authorization');
      } else if (isAttesterSelfieRequired(caught)) {
        setSelfieRejected(true);
      }
      setError(getApiErrorMessage(caught, 'Verification failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (step !== 'done' && (status === 'verified' || status === 'pending')) {
    return (
      <KycStatusCard
        status={status}
        description={
          status === 'verified'
            ? 'Your company has already been verified — no need to submit KYC again.'
            : undefined
        }
      />
    );
  }

  if (step !== 'done' && status === 'rejected' && !retrying) {
    return (
      <KycStatusCard
        status="rejected"
        adminComment={kycAdminComment(user)}
        onRetry={() => {
          setRetrying(true);
          setStep(attestationKnownMissing(user) ? 'authorization' : 'address');
        }}
      />
    );
  }

  if (step === 'authorization') {
    return <AttestationStep onAccepted={() => setStep('intro')} />;
  }

  if (step === 'address') {
    return (
      <KycAddressStep
        values={address}
        onChange={(patch) => setAddress((current) => ({ ...current, ...patch }))}
        onNext={() => setStep('method')}
      />
    );
  }

  if (step === 'method') {
    return (
      <KycMethodStep
        values={method}
        onChange={(patch) => setMethod((current) => ({ ...current, ...patch }))}
        onSubmit={() => void handleSubmit()}
        submitting={submitting}
        error={error}
        selfieRejected={selfieRejected}
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-brand-900">Complete your KYC</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your company&rsquo;s identity to keep Rateo safe and trusted. Once approved,
          you&rsquo;ll unlock full access to candidate profiles.
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
          <li>• Company Address</li>
          <li>• Proof of Address</li>
          <li>• CAC documents</li>
        </ul>
        <Button
          className="mt-5 h-11 w-full bg-brand-700 text-white sm:w-auto"
          onClick={() => setStep('address')}
        >
          Let&rsquo;s go
          <ArrowRight aria-hidden="true" />
        </Button>
      </section>
    </div>
  );
}

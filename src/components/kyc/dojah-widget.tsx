'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api/errors';
import { dojahWidgetUrl, isAttestationRequired, kycService } from '@/services/kyc';

const SUCCESS_RE = /success|complete|approved|verified|finish/i;
const CLOSE_RE = /close|cancel|exit|error/i;

/** The event payload is provider-shaped; flatten it to something matchable. */
function signalFrom(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    for (const key of ['type', 'event', 'status']) {
      const value = record[key];
      if (typeof value === 'string') return value;
    }
  }
  return '';
}

/**
 * Dojah's hosted identity widget, embedded.
 *
 * The browser never holds a Dojah secret: `POST /users/kyc/dojah/init` mints a
 * widget id plus a per-attempt reference, and the real verified flip happens
 * server-side on Dojah's webhook. So `confirm` is a nudge in case the webhook
 * was missed, and `cancel` only releases an untouched session - neither is
 * allowed to declare the user verified.
 *
 * The iframe is deliberately NOT sandboxed: the widget loads its own scripts
 * and needs the camera for the liveness check.
 *
 * TODO(dojah-sandbox): the hosted widget's postMessage contract is unconfirmed,
 * which is why the explicit "I've finished" / "Cancel" buttons exist.
 *
 * `flow` picks the Dojah product: `individual` (NIN + liveness) or `business`
 * (CAC + director). The business flow is gated server-side on the authorization
 * attestation, so `init` can answer 400 ATTESTATION_REQUIRED - that is not a
 * failure, it means the company has to declare who is verifying first.
 */
export function DojahWidget({ flow = 'individual' }: { flow?: 'individual' | 'business' }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAttestation, setNeedsAttestation] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // One terminal action per visit: a postMessage and a button tap must not
  // both run the finish path.
  const settled = useRef(false);

  useEffect(() => {
    let active = true;

    kycService
      .dojahInit(flow)
      .then((config) => {
        if (!active) return;
        const next = dojahWidgetUrl(config);
        if (!next) {
          setError('Verification is temporarily unavailable. Please try again.');
          return;
        }
        setUrl(next);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (isAttestationRequired(caught)) setNeedsAttestation(true);
        setError(getApiErrorMessage(caught, 'Could not start verification.'));
      });

    return () => {
      active = false;
    };
  }, [flow]);

  const finish = useCallback(async () => {
    if (settled.current) return;
    settled.current = true;
    setFinishing(true);
    await kycService.dojahConfirm().catch(() => {});
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    toast.success("We're verifying your identity — your badge updates shortly.");
    router.push('/dashboard/profile');
    router.refresh();
  }, [queryClient, router]);

  const cancel = useCallback(async () => {
    if (settled.current) return;
    settled.current = true;
    await kycService.dojahCancel().catch(() => {});
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    router.push('/dashboard/kyc');
    router.refresh();
  }, [queryClient, router]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only Dojah's own frame may drive this screen. An opaque origin
      // ("null") is not parseable and is never ours.
      let host: string;
      try {
        host = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (!/(^|\.)dojah\.io$/i.test(host)) return;

      const signal = signalFrom(event.data);
      if (!signal) return;
      if (SUCCESS_RE.test(signal)) void finish();
      else if (CLOSE_RE.test(signal)) void cancel();
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [finish, cancel]);

  if (error) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent-50 text-accent-600"
        >
          <AlertCircle className="size-7" />
        </span>
        <p className="text-lg font-semibold text-brand-900">Something went wrong</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button asChild className="mt-6 h-11 bg-brand-700 text-white">
          <Link href="/dashboard/kyc">
            {needsAttestation ? 'Complete the authorization' : 'Verify manually instead'}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {url ? (
          <iframe
            src={url}
            title="Dojah identity verification"
            // The widget runs its own scripts and needs the camera; a sandbox
            // attribute would break the liveness check outright.
            allow="camera; microphone"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-[calc(100vh-13rem)] w-full border-0 md:h-auto md:min-h-160"
          />
        ) : (
          <div className="flex h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Starting verification…
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 flex-1 bg-brand-700 text-white"
          disabled={!url || finishing}
          onClick={() => void finish()}
        >
          {finishing ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
          I&rsquo;ve finished
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1"
          disabled={finishing}
          onClick={() => void cancel()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

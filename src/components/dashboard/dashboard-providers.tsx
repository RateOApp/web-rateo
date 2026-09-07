"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { KycRequiredDialog } from "@/components/dashboard/kyc-required-dialog";
import { ParticipationLockDialog } from "@/components/dashboard/participation-lock-dialog";
import { useMe } from "@/hooks/use-me";
import { useParticipationStatus } from "@/hooks/use-participation";
import { PARTICIPATION_OVERDUE_EVENT } from "@/lib/api/client";
import type { KycStatus } from "@/types/api";

/* -------------------------------------------------------------------------- */
/* KYC gate                                                                   */
/* -------------------------------------------------------------------------- */

export type KycGate = {
  verified: boolean;
  status: KycStatus;
  /**
   * Runs `next` and returns `true` when the user is verified; otherwise opens
   * the KYC dialog and returns `false`, so callers can `if (!requireVerified())
   * return;` before touching the API.
   */
  requireVerified: (next?: () => void) => boolean;
  /** Force the dialog open - e.g. after a 403 whose message mentions KYC. */
  open: () => void;
  /**
   * The dialog element for consumers rendered OUTSIDE the dashboard (the
   * public job page mounts `JobActions` with no providers around it). It is
   * `null` when a provider is mounted, because the provider renders its own.
   */
  fallback: React.ReactNode;
};

const KycGateContext = createContext<KycGate | null>(null);

function KycGateProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useMe();
  const [open, setOpen] = useState(false);

  const status: KycStatus = user?.kycStatus ?? "none";
  const verified = status === "verified";

  const requireVerified = useCallback(
    (next?: () => void) => {
      if (verified) {
        next?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [verified],
  );

  const value = useMemo<KycGate>(
    () => ({
      verified,
      status,
      requireVerified,
      open: () => setOpen(true),
      fallback: null,
    }),
    [verified, status, requireVerified],
  );

  return (
    <KycGateContext.Provider value={value}>
      {children}
      <KycRequiredDialog open={open} onOpenChange={setOpen} />
    </KycGateContext.Provider>
  );
}

/**
 * The KYC gate, with a self-contained fallback so the same component can be
 * rendered on public pages. Without a provider the gate is optimistic
 * (`requireVerified` lets the call through and the backend's 403 decides) -
 * we cannot know the viewer's KYC status there without an authenticated fetch.
 */
export function useKycGate(): KycGate {
  const provided = useContext(KycGateContext);
  const [open, setOpen] = useState(false);

  const standalone = useMemo<KycGate>(
    () => ({
      verified: true,
      status: "none",
      requireVerified: (next?: () => void) => {
        next?.();
        return true;
      },
      open: () => setOpen(true),
      fallback: <KycRequiredDialog open={open} onOpenChange={setOpen} />,
    }),
    [open],
  );

  return provided ?? standalone;
}

/* -------------------------------------------------------------------------- */
/* Participation lock                                                         */
/* -------------------------------------------------------------------------- */

export type ParticipationLock = {
  /** Open the unlock dialog. */
  open: () => void;
  /** `true` when this month's rating is overdue, so callers can pre-empt. */
  isOverdue: boolean;
  /** Dialog element for consumers rendered outside the dashboard. */
  fallback: React.ReactNode;
};

const ParticipationLockContext = createContext<ParticipationLock | null>(null);

function ParticipationLockProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data } = useParticipationStatus();
  const isOverdue = data?.participationStatus === "overdue";

  // Any axios 403 carrying `code: 'PARTICIPATION_OVERDUE'` fires this event,
  // so a locked endpoint anywhere in the app surfaces the same dialog.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(PARTICIPATION_OVERDUE_EVENT, handler);
    return () => window.removeEventListener(PARTICIPATION_OVERDUE_EVENT, handler);
  }, []);

  const value = useMemo<ParticipationLock>(
    () => ({ open: () => setOpen(true), isOverdue, fallback: null }),
    [isOverdue],
  );

  return (
    <ParticipationLockContext.Provider value={value}>
      {children}
      <ParticipationLockDialog open={open} onOpenChange={setOpen} />
    </ParticipationLockContext.Provider>
  );
}

/** Same fallback contract as `useKycGate` - safe outside the dashboard. */
export function useParticipationLock(): ParticipationLock {
  const provided = useContext(ParticipationLockContext);
  const [open, setOpen] = useState(false);

  const standalone = useMemo<ParticipationLock>(
    () => ({
      open: () => setOpen(true),
      isOverdue: false,
      fallback: <ParticipationLockDialog open={open} onOpenChange={setOpen} />,
    }),
    [open],
  );

  return provided ?? standalone;
}

/* -------------------------------------------------------------------------- */

/** Mounted once by the dashboard layout, inside `<UserProvider>`. */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <KycGateProvider>
      <ParticipationLockProvider>{children}</ParticipationLockProvider>
    </KycGateProvider>
  );
}

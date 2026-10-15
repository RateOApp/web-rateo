'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { adminName: string; userName: string; expiresAt: string };

function remainingSeconds(expiresAt: string): number {
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((t - Date.now()) / 1000));
}

function format(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Fixed red bar shown for the whole admin support session. */
export function ImpersonationBanner({ userName, expiresAt }: Props) {
  const [left, setLeft] = useState(() => remainingSeconds(expiresAt));
  const exiting = useRef(false);

  const exit = useCallback(async () => {
    if (exiting.current) return;
    exiting.current = true;
    try {
      await fetch('/api/auth/impersonate/exit', { method: 'POST' });
    } catch {
      // The session is short-lived anyway; leave regardless.
    }
    // Hard navigation on purpose: drops all cached RSC/query state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/impersonate/ended';
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setLeft(remainingSeconds(expiresAt)), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (left <= 0) void exit();
  }, [left, exit]);

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-center gap-2 bg-red-600 px-3 text-xs font-medium text-white sm:text-sm"
    >
      <span className="min-w-0 truncate">
        Admin support session · Viewing as {userName} · Expires in {format(left)}
      </span>
      <button
        type="button"
        onClick={() => void exit()}
        className="shrink-0 rounded bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        Exit
      </button>
    </div>
  );
}

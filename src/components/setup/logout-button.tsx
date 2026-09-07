'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { hardNavigate } from '@/lib/navigate';

/**
 * The only way out of the wizard. The session cookies are httpOnly, so they can
 * only be dropped by the route handler; the hard navigation afterwards makes
 * every server component re-render without the stale session.
 */
export function SetupLogoutButton() {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // The cookies may already be gone; sending the user to /login is still
      // the right outcome, so failure here is not worth surfacing.
    } finally {
      hardNavigate('/login');
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className="h-9 text-sm font-medium text-brand-900"
      disabled={busy}
      onClick={() => void handleLogout()}
    >
      Log out
    </Button>
  );
}

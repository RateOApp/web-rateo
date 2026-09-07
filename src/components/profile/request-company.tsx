'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { useParticipationLock } from '@/components/dashboard/dashboard-providers';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCompanySearch } from '@/hooks/use-company-search';
import { useWorkHistory } from '@/hooks/use-work-history';
import { getApiErrorMessage } from '@/lib/api/errors';
import { invitationsService } from '@/services/invitations';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Join a company.
 *
 * The link is what makes the monthly rating relationship real, so a company
 * that is not on Rate'O yet gets an invite rather than a dead name - signing up
 * with that address connects the two accounts automatically.
 *
 * `POST /users/request-company` is participation-locked server-side; an overdue
 * user is pre-empted with the unlock dialog instead of a 403.
 */
export function RequestCompany({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lock = useParticipationLock();

  const { data: history } = useWorkHistory(user._id);

  const [query, setQuery] = useState('');
  const { companies, isFetching } = useCompanySearch(query);

  const [confirming, setConfirming] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // The current company link, verified or still awaiting confirmation.
  const currentJob = useMemo(
    () => (history ?? []).find((item) => item.current && item.companyId) ?? null,
    [history],
  );

  const trimmed = query.trim();
  const noResults = trimmed.length > 1 && !isFetching && companies.length === 0;

  function pick(company: User) {
    if (lock.isOverdue) {
      lock.open();
      return;
    }
    setError(null);
    setConfirming(company);
  }

  async function sendRequest() {
    if (!confirming || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await usersService.requestToJoinCompany(confirming._id);
      const name = confirming.companyName || 'The company';
      setConfirming(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['workHistory', user._id] }),
      ]);
      router.refresh();
      toast.success('Request sent', {
        description: `${name} will confirm you as an employee. You'll see it once they accept.`,
      });
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not send request'));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendInvite() {
    const email = inviteEmail.trim();
    if (!EMAIL_RE.test(email)) {
      setInviteError('Please enter a valid company email.');
      return;
    }
    setInviteError(null);
    setInviting(true);
    try {
      const result = await invitationsService.inviteCompany(email, trimmed);
      setInviteOpen(false);
      setInviteEmail('');

      if (result.companyExists && result.companyId) {
        toast.info(
          `${result.companyName || 'This company'} is already on Rate'O — search for them and send a request.`,
        );
        return;
      }

      toast.success('Invite sent', {
        description: `We've invited ${trimmed} to join Rateo. When they sign up with ${email}, you'll be connected automatically.`,
      });
    } catch (caught) {
      setInviteError(getApiErrorMessage(caught, 'Could not send invite'));
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {currentJob ? (
        <div
          className={
            currentJob.isVerified
              ? 'flex items-start gap-2 rounded-2xl border border-success/30 bg-success/5 p-3 text-sm text-brand-900'
              : 'flex items-start gap-2 rounded-2xl border border-accent-600/30 bg-accent-50 p-3 text-sm text-brand-900'
          }
        >
          {currentJob.isVerified ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-600" />
          )}
          <span>
            {currentJob.isVerified
              ? `You're confirmed at ${currentJob.company || 'your company'}.`
              : `Request pending with ${currentJob.company || 'your company'} — they'll confirm you soon.`}
          </span>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Search for your company and send a request to join. The company will confirm you as an
        employee.
      </p>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          placeholder="Search company name"
          aria-label="Search company name"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 pl-9"
        />
        {isFetching ? (
          <Loader2
            aria-hidden="true"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-accent-600"
          />
        ) : null}
      </div>

      {noResults ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            &ldquo;{trimmed}&rdquo; isn&rsquo;t on Rateo yet. Invite them so they can confirm you as
            an employee.
          </p>
          <Button
            className="mt-3 h-10 bg-brand-700 text-white"
            onClick={() => {
              setInviteEmail('');
              setInviteError(null);
              setInviteOpen(true);
            }}
          >
            <Mail aria-hidden="true" />
            Invite {trimmed}
          </Button>
        </div>
      ) : null}

      {companies.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {companies.map((company) => (
            <li key={company._id}>
              <button
                type="button"
                onClick={() => pick(company)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
              >
                <UserAvatar user={company} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-900">
                    {company.companyName || 'Company'}
                  </span>
                  {company.industry ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {company.industry}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  Request
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) setConfirming(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Request to join</DialogTitle>
            <DialogDescription>
              Send a request to join &ldquo;{confirming?.companyName ?? ''}&rdquo;? They&rsquo;ll
              confirm you as an employee.
            </DialogDescription>
          </DialogHeader>
          <FormAlert>{error}</FormAlert>
          <DialogFooter>
            <Button variant="outline" disabled={submitting} onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-700 text-white"
              disabled={submitting}
              onClick={() => void sendRequest()}
            >
              {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={inviting ? undefined : setInviteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite {trimmed || 'your company'}</DialogTitle>
            <DialogDescription>
              Enter the company&rsquo;s email. They&rsquo;ll get an invite to join Rateo, and
              signing up with this email automatically connects you.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={inviteEmail}
            placeholder="company@email.com"
            aria-label="Company email"
            disabled={inviting}
            onChange={(event) => setInviteEmail(event.target.value)}
            className="h-11"
          />
          <FormAlert>{inviteError}</FormAlert>
          <DialogFooter>
            <Button variant="outline" disabled={inviting} onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-700 text-white"
              disabled={inviting}
              onClick={() => void sendInvite()}
            >
              {inviting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lock.fallback}
    </div>
  );
}

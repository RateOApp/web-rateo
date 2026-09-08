'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { companyEmployeesService } from '@/services/company-employees';
import type { TerminatedEmployee } from '@/types/company';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** "Recover within 2d 4h" — the window closes on the server's clock, not ours. */
function countdown(deadline: string | undefined): string {
  const ms = new Date(deadline ?? '').getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'Recovery window closing';
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  return days > 0 ? `Recover within ${days}d ${hours}h` : `Recover within ${hours}h`;
}

/**
 * One past employment.
 *
 * `recoverable` is the server's verdict and is used as-is: it already folds in
 * both rules that matter - the 3-day window, and the fact that a resignation is
 * the employee's decision and cannot be reversed by the company. Recomputing it
 * from `recoveryDeadline` alone would offer a Recover button that 403s.
 */
export function TerminatedRow({ item }: { item: TerminatedEmployee }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [recovering, setRecovering] = useState(false);

  const name = item.name?.trim() || 'Employee';
  const resigned = item.endedBy === 'employee';
  const recoverable = item.recoverable === true;

  async function handleRecover() {
    if (recovering) return;
    setRecovering(true);
    try {
      await companyEmployeesService.recover(item.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['companyEmployees'] }),
        queryClient.invalidateQueries({ queryKey: ['terminatedEmployees'] }),
      ]);
      router.refresh();
      toast.success('Employee recovered', {
        description: 'The employee has been reinstated.',
      });
    } catch (caught) {
      // A 410 (window expired) or 403 (resigned) means this row is stale -
      // refetch so the button disappears with the message.
      void queryClient.invalidateQueries({ queryKey: ['terminatedEmployees'] });
      toast.error(getApiErrorMessage(caught, 'Failed to recover employee'));
    } finally {
      setRecovering(false);
    }
  }

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
      <UserAvatar user={{ firstName: name, avatar: item.avatar }} className="size-11" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-900">{name}</p>

        {resigned || item.endMethod ? (
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            {resigned ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">
                Resigned
              </span>
            ) : null}
            {item.endMethod ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-700">
                {item.endMethod === 'notice'
                  ? `Gave notice${item.noticeDays ? ` · ${item.noticeDays}d` : ''}`
                  : 'Immediate'}
              </span>
            ) : null}
          </p>
        ) : null}

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.role?.trim() || 'Employee'}
        </p>

        {recoverable ? (
          <p className="mt-1 text-xs font-medium text-accent-600">
            {countdown(item.recoveryDeadline)}
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              Terminated {formatDate(item.terminatedAt) ?? '—'}
            </p>
            {item.endReason ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {item.endReason}
              </p>
            ) : null}
          </>
        )}
      </div>

      {recoverable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={recovering}
          onClick={() => void handleRecover()}
        >
          {recovering ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
          Recover
        </Button>
      ) : null}
    </article>
  );
}

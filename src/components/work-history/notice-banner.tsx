'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { employmentService } from '@/services/employment';
import type { WorkHistoryItem } from '@/types/profile';

type NoticeBannerProps = {
  /** The still-current job that carries a pending `noticeEffectiveDate`. */
  item: WorkHistoryItem;
  userId: string;
};

/**
 * Pending-notice banner.
 *
 * A notice keeps the employment active until the last working day, so this sits
 * above the list rather than on the card. Only the party who gave the notice
 * may withdraw it - the server enforces that too, so a company-given notice
 * shows no button at all.
 */
export function NoticeBanner({ item, userId }: NoticeBannerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState(false);

  const lastDay = formatDate(item.noticeEffectiveDate);
  const givenByEmployee = item.endedBy === 'employee';

  async function handleWithdraw() {
    if (withdrawing) return;
    setWithdrawing(true);
    try {
      await employmentService.withdrawNotice();
      toast.success('Notice withdrawn', { description: 'Your employment continues as before.' });
    } catch (caught) {
      // A 404/403 means the server state moved on; refetching is the fix either way.
      toast.error('Could not withdraw notice', {
        description: getApiErrorMessage(caught, 'Please try again.'),
      });
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workHistory', userId] }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ]);
      router.refresh();
      setWithdrawing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <Clock aria-hidden="true" className="size-4" />
        Notice period active
      </p>
      <p className="mt-1 text-sm text-brand-900">
        {givenByEmployee
          ? `You gave ${item.noticeDays ?? ''} days' notice — last working day ${lastDay}.`
          : `Your employer has given you notice — last working day ${lastDay}.`}
      </p>
      {givenByEmployee ? (
        <Button
          variant="outline"
          className="mt-3 h-10 border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={withdrawing}
          onClick={() => void handleWithdraw()}
        >
          {withdrawing ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
          Withdraw notice
        </Button>
      ) : null}
    </div>
  );
}

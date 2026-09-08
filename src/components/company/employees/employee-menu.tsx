'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Star, Undo2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from '@/lib/rating-window';
import { companyEmployeesService } from '@/services/company-employees';
import type { CompanyEmployee } from '@/types/company';

type EmployeeMenuProps = {
  employee: CompanyEmployee;
  onEndContract: (employee: CompanyEmployee) => void;
};

/**
 * Per-employee actions: rate, withdraw a notice this company gave, end the
 * contract.
 *
 * "Rate now" checks both gates before navigating, because the flow itself
 * cannot be submitted outside the window or twice in a month - walking someone
 * through six steps only to reject the submit is the failure mode this avoids.
 * `ratingRequired` is pre-computed by the server in the roster aggregate, so
 * the check costs nothing.
 *
 * "Withdraw notice" appears only for a notice THIS company gave: the server
 * refuses to let one party undo the other's decision, and offering the button
 * anyway would just surface a 403.
 */
export function EmployeeMenu({ employee, onEndContract }: EmployeeMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState(false);

  const canWithdraw = employee.notice?.givenBy === 'company';
  const name = employee.name?.trim() || 'this employee';

  function handleRate() {
    if (!isWithinRatingWindow()) {
      toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
      return;
    }
    if (employee.ratingRequired === false) {
      toast.info('Already rated', {
        description: `You have already rated ${name} this month.`,
      });
      return;
    }
    router.push(`/dashboard/ratings/rate/${employee.id}`);
  }

  async function handleWithdraw() {
    if (withdrawing) return;
    setWithdrawing(true);
    try {
      await companyEmployeesService.withdrawNotice(employee.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['companyEmployees'] }),
        queryClient.invalidateQueries({ queryKey: ['terminatedEmployees'] }),
      ]);
      router.refresh();
      toast.success('Notice withdrawn', {
        description: `${name}'s employment continues as before.`,
      });
    } catch (caught) {
      // Refresh anyway: a 404 here usually means the notice is already gone.
      void queryClient.invalidateQueries({ queryKey: ['companyEmployees'] });
      toast.error(getApiErrorMessage(caught, 'Failed to withdraw notice'));
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${name}`}
          className="shrink-0"
        >
          {withdrawing ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <MoreHorizontal aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={handleRate}>
          <Star aria-hidden="true" />
          Rate now
        </DropdownMenuItem>

        {canWithdraw ? (
          <DropdownMenuItem disabled={withdrawing} onSelect={() => void handleWithdraw()}>
            <Undo2 aria-hidden="true" />
            Withdraw notice
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem variant="destructive" onSelect={() => onEndContract(employee)}>
          <XCircle aria-hidden="true" />
          End contract
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

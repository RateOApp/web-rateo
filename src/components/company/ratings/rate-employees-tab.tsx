'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Star, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { RequestRow } from '@/components/company/employees/request-row';
import { CardListSkeleton } from '@/components/shared/card-list-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCompanyEmployees } from '@/hooks/use-company-employees';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatRating } from '@/lib/rating';
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from '@/lib/rating-window';
import { companyEmployeesService } from '@/services/company-employees';
import type { CompanyEmployee } from '@/types/company';

/**
 * The rating side of the roster: who is still owed this month's rating, and the
 * claims that must be answered before those people count at all.
 *
 * "Terminate contract" here goes through `DELETE /users/company/employees/:id`,
 * the real termination with its 3-day recovery window. The mobile screen took a
 * shortcut and called `verify(reject)`, which only declines a PENDING claim - on
 * a confirmed employee it silently does nothing and reports success.
 */
export function RateEmployeesTab() {
  const { employees, requests, isLoading } = useCompanyEmployees();
  const [terminating, setTerminating] = useState<CompanyEmployee | null>(null);

  if (isLoading) return <CardListSkeleton rows={3} />;

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}

      {employees.length ? (
        employees.map((employee) => (
          <EmployeeRatingRow
            key={employee.id}
            employee={employee}
            onTerminate={setTerminating}
          />
        ))
      ) : requests.length ? null : (
        <EmptyState
          icon={Users}
          title="No Employees Yet"
          description="Employees who list your company as their current employer will appear here for verification."
        />
      )}

      <TerminateDialog
        employee={terminating}
        onOpenChange={(open) => {
          if (!open) setTerminating(null);
        }}
      />
    </div>
  );
}

function EmployeeRatingRow({
  employee,
  onTerminate,
}: {
  employee: CompanyEmployee;
  onTerminate: (employee: CompanyEmployee) => void;
}) {
  const router = useRouter();
  const name = employee.name?.trim() || 'Employee';

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

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
      <UserAvatar user={{ firstName: name, avatar: employee.avatar }} className="size-11" />

      <div className="min-w-0 flex-1">
        {employee.ratingRequired ? (
          <span className="mb-1 inline-flex rounded-full bg-accent-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-600">
            Rating required
          </span>
        ) : null}
        <p className="truncate text-sm font-semibold text-brand-900">{name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{employee.role?.trim() || 'Employee'}</span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-0.5 font-medium text-brand-900">
            {formatRating(employee.rating)}
            <Star aria-hidden="true" className="size-3 fill-star text-star" />
          </span>
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${name}`}
            className="shrink-0"
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={handleRate}>
            <Star aria-hidden="true" />
            Rate now
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onTerminate(employee)}>
            <UserMinus aria-hidden="true" />
            Terminate contract
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}

function TerminateDialog({
  employee,
  onOpenChange,
}: {
  employee: CompanyEmployee | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    if (!employee || submitting) return;
    setSubmitting(true);
    try {
      await companyEmployeesService.remove(employee.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['companyEmployees'] }),
        queryClient.invalidateQueries({ queryKey: ['terminatedEmployees'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ]);
      router.refresh();
      onOpenChange(false);
      toast.success('Termination successful');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Failed to terminate the contract'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Terminate contract?</DialogTitle>
          <DialogDescription>
            Are you sure you want to terminate contract with this employee?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            size="lg"
            className="h-11 w-full"
            disabled={submitting}
            onClick={() => void confirm()}
          >
            {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            Yes, terminate
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-11 w-full"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

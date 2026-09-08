'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { RatingFlow } from '@/components/ratings/rating-flow';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyEmployees } from '@/hooks/use-company-employees';
import { INDIVIDUAL_CRITERIA } from '@/lib/rating-criteria';
import {
  RATING_UNAVAILABLE_MESSAGE,
  RATING_UNAVAILABLE_TITLE,
  isWithinRatingWindow,
} from '@/lib/rating-window';
import { usersService } from '@/services/users';
import { displayName } from '@/components/shared/user-avatar';

/**
 * `/dashboard/ratings/rate/[employeeId]` — a company rating one employee.
 *
 * The entry gates mirror the employee flow's, with one difference: the roster
 * already knows whether this employee has been rated this month
 * (`ratingRequired`, pre-computed server-side in the same aggregate that builds
 * the list), so no extra request is needed to refuse a duplicate.
 *
 * The name falls back to `GET /users/:id` for the case that matters most: a
 * deep link or a page refresh, where the `['companyEmployees']` cache is empty
 * and the wizard would otherwise ask someone to rate a blank.
 */
export function EmployeeRatingFlow({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const { employees, isLoading } = useCompanyEmployees();
  const employee = employees.find((entry) => entry.id === employeeId);

  const inWindow = isWithinRatingWindow();
  const bounced = useRef(false);

  // Only needed when the roster cache misses - otherwise this never fires.
  const fallback = useQuery({
    queryKey: ['user', employeeId] as const,
    queryFn: () => usersService.byId(employeeId),
    enabled: Boolean(employeeId) && !isLoading && !employee,
    staleTime: 5 * 60 * 1000,
  });

  // Door check 1: outside the window nothing can be submitted at all.
  useEffect(() => {
    if (inWindow || bounced.current) return;
    bounced.current = true;
    toast.error(RATING_UNAVAILABLE_TITLE, { description: RATING_UNAVAILABLE_MESSAGE });
    router.replace('/dashboard/employees');
  }, [inWindow, router]);

  // Door check 2: this month's rating for this employee is already in.
  useEffect(() => {
    if (!employee || bounced.current) return;
    if (employee.ratingRequired === false) {
      bounced.current = true;
      toast.info('Already rated', {
        description: `You have already rated ${employee.name?.trim() || 'this employee'} this month.`,
      });
      router.replace('/dashboard/employees');
    }
  }, [employee, router]);

  if (isLoading || (!employee && fallback.isPending && fallback.fetchStatus !== 'idle')) {
    return (
      <PageContainer className="max-w-xl">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  const name =
    employee?.name?.trim() || (fallback.data ? displayName(fallback.data) : null) || null;

  return (
    <PageContainer className="max-w-xl">
      <RatingFlow
        criteria={INDIVIDUAL_CRITERIA}
        targetId={employeeId}
        targetName={name}
        category="employee_review"
        question="What would you rate this employee in terms of"
        successHref="/dashboard/employees"
        invalidate={[
          ['companyEmployees'],
          ['userReviews'],
          ['participationStatus'],
          ['monthlyPrompt'],
        ]}
      />
    </PageContainer>
  );
}

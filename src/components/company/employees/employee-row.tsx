'use client';

import Link from 'next/link';
import { Clock, Star } from 'lucide-react';

import { EmployeeMenu } from '@/components/company/employees/employee-menu';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatDate } from '@/lib/format';
import { formatRating } from '@/lib/rating';
import type { CompanyEmployee } from '@/types/company';

type EmployeeRowProps = {
  employee: CompanyEmployee;
  onEndContract: (employee: CompanyEmployee) => void;
};

/**
 * One confirmed employee.
 *
 * The "On notice" chip names WHO gave the notice, because the two cases mean
 * opposite things to the company - "given by them" is a resignation in
 * progress, "given by you" is a decision the company can still withdraw - and
 * the last working day is the only date that matters to either.
 */
export function EmployeeRow({ employee, onEndContract }: EmployeeRowProps) {
  const name = employee.name?.trim() || 'Employee';
  const notice = employee.notice;
  const lastDay = formatDate(notice?.effectiveDate);

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
      <UserAvatar user={{ firstName: name, avatar: employee.avatar }} className="size-11" />

      <div className="min-w-0 flex-1">
        {employee.ratingRequired ? (
          <span className="mb-1 inline-flex rounded-full bg-accent-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-600">
            Rating required
          </span>
        ) : null}

        <Link
          href={`/dashboard/talent/${employee.id}?employee=1`}
          className="block truncate text-sm font-semibold text-brand-900 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {name}
        </Link>

        <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{employee.role?.trim() || 'Employee'}</span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-0.5 font-medium text-brand-900">
            {formatRating(employee.rating)}
            <Star aria-hidden="true" className="size-3 fill-star text-star" />
          </span>
        </p>

        {notice ? (
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-600">
              <Clock aria-hidden="true" className="size-3" />
              On notice
            </span>
            <span className="text-xs text-muted-foreground">
              {lastDay ? `Last day ${lastDay} · ` : ''}
              given by {notice.givenBy === 'company' ? 'you' : 'them'}
            </span>
          </p>
        ) : null}
      </div>

      <EmployeeMenu employee={employee} onEndContract={onEndContract} />
    </article>
  );
}

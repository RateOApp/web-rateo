'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { CompanyEndContractDialog } from '@/components/company/employees/company-end-contract-dialog';
import { EmployeeRow } from '@/components/company/employees/employee-row';
import { RequestRow } from '@/components/company/employees/request-row';
import { TerminatedRow } from '@/components/company/employees/terminated-row';
import { CardListSkeleton } from '@/components/shared/card-list-skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyEmployees } from '@/hooks/use-company-employees';
import { useTerminatedEmployees } from '@/hooks/use-terminated-employees';
import type { CompanyEmployee } from '@/types/company';

export type EmployeesTab = 'employees' | 'pending' | 'terminated';

export function parseEmployeesTab(value: string | undefined): EmployeesTab {
  if (value === 'pending' || value === 'terminated') return value;
  return 'employees';
}

function Empty({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * The roster: current employees, unanswered join requests, and everyone who has
 * left.
 *
 * All three lists load together rather than per tab, because the two counts in
 * the tab labels are the point of the screen - a company needs to see that
 * someone is waiting on them without opening the tab to find out. The two
 * queries behind them are shared caches (`['companyEmployees']`,
 * `['terminatedEmployees']`), so the ratings tab and the talent pages get the
 * same data for free.
 */
export function EmployeesTabs({ initialTab }: { initialTab: EmployeesTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<EmployeesTab>(initialTab);
  const [query, setQuery] = useState('');
  const [ending, setEnding] = useState<CompanyEmployee | null>(null);

  const { employees, requests, isLoading } = useCompanyEmployees();
  const { terminated, isLoading: terminatedLoading } = useTerminatedEmployees();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter(
      (employee) =>
        (employee.name ?? '').toLowerCase().includes(needle) ||
        (employee.role ?? '').toLowerCase().includes(needle),
    );
  }, [employees, query]);

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = parseEmployeesTab(value);
          setTab(next);
          router.replace(
            next === 'employees' ? '/dashboard/employees' : `/dashboard/employees?tab=${next}`,
            { scroll: false },
          );
        }}
      >
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="employees" className="flex-1">
            Employees
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending{requests.length > 0 ? ` (${requests.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="terminated" className="flex-1">
            Terminated{terminated.length > 0 ? ` (${terminated.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="flex flex-col gap-3">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              aria-label="Search employees"
              placeholder="Search employee..."
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 pl-9"
            />
          </div>

          {isLoading ? (
            <CardListSkeleton rows={3} />
          ) : filtered.length ? (
            filtered.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} onEndContract={setEnding} />
            ))
          ) : (
            <Empty>No employees yet</Empty>
          )}
        </TabsContent>

        <TabsContent value="pending" className="flex flex-col gap-3">
          {isLoading ? (
            <CardListSkeleton rows={2} />
          ) : requests.length ? (
            requests.map((request) => <RequestRow key={request.id} request={request} />)
          ) : (
            <Empty>No pending requests</Empty>
          )}
        </TabsContent>

        <TabsContent value="terminated" className="flex flex-col gap-3">
          {terminatedLoading ? (
            <CardListSkeleton rows={2} />
          ) : terminated.length ? (
            terminated.map((item) => <TerminatedRow key={item.id} item={item} />)
          ) : (
            <Empty>No terminated employees</Empty>
          )}
        </TabsContent>
      </Tabs>

      <CompanyEndContractDialog
        open={ending !== null}
        onOpenChange={(open) => {
          if (!open) setEnding(null);
        }}
        employee={ending}
      />
    </>
  );
}

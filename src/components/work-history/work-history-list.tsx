'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Briefcase, CalendarDays, LogOut, Pencil, Plus, Zap } from 'lucide-react';

import { CardListSkeleton } from '@/components/shared/card-list-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { EndContractDialog } from '@/components/work-history/end-contract-dialog';
import { NoticeBanner } from '@/components/work-history/notice-banner';
import { UpdateJobDialog } from '@/components/work-history/update-job-dialog';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/use-me';
import { useWorkHistory } from '@/hooks/use-work-history';
import { toDate } from '@/lib/format';
import type { WorkHistoryItem } from '@/types/profile';

/** `"2023-04-01" -> "4/2023"`, the compact period format the mobile cards use. */
function monthYear(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? `${date.getMonth() + 1}/${date.getFullYear()}` : '';
}

/**
 * The end method is shown only on the profile of the party who initiated it -
 * a company-ended job carries no chip on the employee's own page.
 */
function methodChip(item: WorkHistoryItem) {
  if (item.current || !item.endMethod || item.endedBy !== 'employee') return null;

  const label =
    item.endMethod === 'notice'
      ? item.noticeDays
        ? `Resigned — gave ${item.noticeDays} days' notice`
        : 'Resigned — gave notice'
      : 'Resigned — immediate';

  const Icon = item.endMethod === 'notice' ? CalendarDays : Zap;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
}

/** Work history: the list, the pending-notice banner and both dialogs. */
export function WorkHistoryList() {
  const { data: user } = useMe();
  const userId = user?._id;
  const { data: history, isLoading } = useWorkHistory(userId);

  const [editing, setEditing] = useState<WorkHistoryItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [ending, setEnding] = useState<WorkHistoryItem | null>(null);

  const items = useMemo(() => history ?? [], [history]);

  // A pending notice lives on the still-current job as `noticeEffectiveDate`.
  const pendingNotice = useMemo(
    () => items.find((item) => item.current && item.noticeEffectiveDate) ?? null,
    [items],
  );

  function openEditor(item: WorkHistoryItem | null) {
    setEditing(item);
    setEditorOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          className="h-10 bg-brand-700 text-white"
          disabled={!user}
          onClick={() => openEditor(null)}
        >
          <Plus aria-hidden="true" />
          Add new
        </Button>
      </div>

      {pendingNotice && userId ? <NoticeBanner item={pendingNotice} userId={userId} /> : null}

      {isLoading ? (
        <CardListSkeleton rows={2} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No work history added yet."
          description="Add your past work experience to build your profile."
          action={
            <Button className="h-10 bg-brand-700 text-white" onClick={() => openEditor(null)}>
              <Plus aria-hidden="true" />
              Add experience
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={item.id ?? `${item.company}-${index}`}
              className={
                item.current
                  ? 'rounded-2xl border border-brand-700/40 bg-card p-4'
                  : 'rounded-2xl border border-border bg-card p-4'
              }
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 text-base font-semibold text-brand-900">
                  <span className="truncate">{item.company || 'Unknown company'}</span>
                  {item.isVerified ? (
                    <BadgeCheck
                      aria-label="Verified by the company"
                      className="size-4 shrink-0 text-success"
                    />
                  ) : null}
                </p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${item.title ?? 'this experience'}`}
                  onClick={() => openEditor(item)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Briefcase aria-hidden="true" className="size-4" />
                  {item.title || 'Role'}
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  {monthYear(item.startDate)} – {item.current ? 'Present' : monthYear(item.endDate)}
                </span>
              </p>

              {methodChip(item) ? <div className="mt-2">{methodChip(item)}</div> : null}

              <div className="mt-3 border-t border-border pt-3">
                {item.description ? (
                  <p className="text-sm text-brand-900">{item.description}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add a description of your role
                  </button>
                )}
              </div>

              {item.current && item.companyId && !item.noticeEffectiveDate ? (
                <Button
                  variant="ghost"
                  className="mt-3 h-10 text-destructive hover:bg-destructive/10"
                  onClick={() => setEnding(item)}
                >
                  <LogOut aria-hidden="true" />
                  End contract
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <UpdateJobDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          user={user}
          item={editing}
        />
      ) : null}

      {userId ? (
        <EndContractDialog
          open={ending !== null}
          onOpenChange={(open) => {
            if (!open) setEnding(null);
          }}
          item={ending}
          userId={userId}
        />
      ) : null}
    </div>
  );
}

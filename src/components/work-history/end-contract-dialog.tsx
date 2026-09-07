'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Info,
  Loader2,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import {
  EMPLOYEE_END_REASONS,
  employmentService,
  IMMEDIATE_INFO_TEXT,
  MAX_NOTICE_DAYS,
  MIN_NOTICE_DAYS,
  NOTICE_INFO_TEXT,
} from '@/services/employment';
import type { WorkHistoryItem } from '@/types/profile';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTE_MAX = 500;

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function toInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Calendar days between today and `value`, matching the server's day math. */
function daysFromToday(value: string): number {
  const picked = new Date(value);
  picked.setHours(0, 0, 0, 0);
  return Math.round((picked.getTime() - startOfToday().getTime()) / DAY_MS);
}

type View = 'choose' | 'notice' | 'immediate';

type EndContractDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The current, company-linked job being ended. */
  item: WorkHistoryItem | null;
  userId: string;
};

/**
 * Ending a contract, employee side.
 *
 * Two paths with very different consequences, so the chooser carries the
 * consequence copy behind an info toggle and the immediate form repeats it as
 * a permanent box - the method is public reputation data and, for `immediate`,
 * cannot be undone.
 *
 * The form is mounted only while the dialog is open, so a dismissed attempt
 * never leaves a stale reason or date behind for the next job.
 */
export function EndContractDialog({ open, onOpenChange, item, userId }: EndContractDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <EndContractBody onOpenChange={onOpenChange} item={item} userId={userId} /> : null}
    </Dialog>
  );
}

function EndContractBody({ onOpenChange, item, userId }: Omit<EndContractDialogProps, 'open'>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>('choose');
  const [info, setInfo] = useState<'notice' | 'immediate' | null>(null);
  const [effectiveDate, setEffectiveDate] = useState(() =>
    toInputValue(addDays(startOfToday(), MIN_NOTICE_DAYS)),
  );
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bounds = useMemo(
    () => ({
      min: toInputValue(addDays(startOfToday(), MIN_NOTICE_DAYS)),
      max: toInputValue(addDays(startOfToday(), MAX_NOTICE_DAYS)),
    }),
    [],
  );

  const companyName = item?.company || 'this company';
  const noteTrimmed = note.trim();
  const noteRequired = reason === 'Others';
  const noteError =
    noteRequired && noteTrimmed.length > 0 && noteTrimmed.length < 3
      ? 'Please give at least 3 characters.'
      : noteTrimmed.length > NOTE_MAX
        ? 'Please keep it under 500 characters.'
        : null;
  const noteValid = noteRequired
    ? noteTrimmed.length >= 3 && noteTrimmed.length <= NOTE_MAX
    : noteTrimmed.length <= NOTE_MAX;
  const noticeDays = daysFromToday(effectiveDate);
  const dateValid = noticeDays >= MIN_NOTICE_DAYS && noticeDays <= MAX_NOTICE_DAYS;
  const formValid = Boolean(reason) && noteValid && (view !== 'notice' || dateValid);

  async function submit(mode: 'notice' | 'immediate') {
    if (!formValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await employmentService.end({
        mode,
        reason,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
        ...(mode === 'notice'
          ? { effectiveDate: new Date(`${effectiveDate}T00:00:00`).toISOString() }
          : {}),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workHistory', userId] }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['participationStatus'] }),
      ]);
      router.refresh();
      onOpenChange(false);

      if (mode === 'notice') {
        toast.success('Notice given', {
          description: `Your last working day is ${
            formatDate(result.noticeEffectiveDate) ?? formatDate(effectiveDate)
          }.`,
        });
      } else {
        toast.success('Contract ended', { description: 'Your employment has ended today.' });
      }
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not end the contract. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  function reasonAndNote() {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end-reason" className="text-brand-900">
            Reason
          </Label>
          <Select value={reason} onValueChange={setReason} disabled={submitting}>
            <SelectTrigger id="end-reason" className="h-11 w-full">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEE_END_REASONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end-note" className="text-brand-900">
            Note{' '}
            <span className="font-normal text-muted-foreground">
              {noteRequired ? '(Required)' : '(Optional)'}
            </span>
          </Label>
          <Textarea
            id="end-note"
            value={note}
            rows={3}
            maxLength={NOTE_MAX}
            disabled={submitting}
            aria-invalid={noteError ? true : undefined}
            placeholder={
              noteRequired
                ? "Please tell us more (required for 'Others')..."
                : 'Add any extra context...'
            }
            onChange={(event) => setNote(event.target.value)}
            className="min-h-20 rounded-xl"
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-destructive">{noteError ?? ''}</p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {noteTrimmed.length}/{NOTE_MAX}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      {view === 'choose' ? (
        <>
          <DialogHeader>
            <DialogTitle>End contract</DialogTitle>
            <DialogDescription>
              How do you want to end your employment with {companyName}?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="relative rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setView('notice')}
                className="flex w-full items-start gap-3 rounded-2xl p-3 pr-20 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
                >
                  <CalendarDays className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-900">Give notice</span>
                  <span className="block text-xs text-muted-foreground">
                    Pick a last working day at least 7 days ahead — employment continues until then
                  </span>
                </span>
              </button>
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="About giving notice"
                  aria-expanded={info === 'notice'}
                  onClick={() => setInfo((current) => (current === 'notice' ? null : 'notice'))}
                >
                  <Info aria-hidden="true" />
                </Button>
                <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </div>
              {info === 'notice' ? (
                <p className="px-3 pb-3 text-xs text-muted-foreground">{NOTICE_INFO_TEXT}</p>
              ) : null}
            </div>

            <div className="relative rounded-2xl border border-destructive/30 bg-destructive/5">
              <button
                type="button"
                onClick={() => setView('immediate')}
                className="flex w-full items-start gap-3 rounded-2xl p-3 pr-20 text-left transition-colors hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-destructive/30 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                >
                  <Zap className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-destructive">
                    End immediately
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Ends today. This cannot be undone
                  </span>
                </span>
              </button>
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="About ending immediately"
                  aria-expanded={info === 'immediate'}
                  onClick={() =>
                    setInfo((current) => (current === 'immediate' ? null : 'immediate'))
                  }
                >
                  <Info aria-hidden="true" />
                </Button>
                <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </div>
              {info === 'immediate' ? (
                <p className="px-3 pb-3 text-xs text-muted-foreground">{IMMEDIATE_INFO_TEXT}</p>
              ) : null}
            </div>

            <Button variant="ghost" className="h-11" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </>
      ) : null}

      {view === 'notice' ? (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Back"
                disabled={submitting}
                onClick={() => setView('choose')}
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
              Give notice
            </DialogTitle>
            <DialogDescription>
              Your employment with {companyName} continues until your last working day.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last-working-day" className="text-brand-900">
                Last working day
              </Label>
              <Input
                id="last-working-day"
                type="date"
                value={effectiveDate}
                min={bounds.min}
                max={bounds.max}
                disabled={submitting}
                aria-invalid={dateValid ? undefined : true}
                onChange={(event) => setEffectiveDate(event.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {dateValid
                  ? `Last working day: ${formatDate(effectiveDate)} · ${noticeDays} days' notice`
                  : `Pick a day between ${MIN_NOTICE_DAYS} and ${MAX_NOTICE_DAYS} days from today.`}
              </p>
            </div>

            {reasonAndNote()}
            <FormAlert>{error}</FormAlert>

            <div className="flex flex-col gap-2">
              <Button
                className="h-11 bg-brand-700 text-white"
                disabled={!formValid || submitting}
                onClick={() => void submit('notice')}
              >
                {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
                Confirm notice
              </Button>
              <Button
                variant="ghost"
                className="h-11"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {view === 'immediate' ? (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Back"
                disabled={submitting}
                onClick={() => setView('choose')}
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
              End immediately
            </DialogTitle>
            <DialogDescription className="flex items-start gap-2 text-destructive">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              This ends your employment today and cannot be undone
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {reasonAndNote()}

            <div className="flex items-start gap-2 rounded-xl border border-accent-600/30 bg-accent-50 p-3 text-xs text-brand-900">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-600" />
              <span>
                This ends the contract today, cannot be undone, and is permanently recorded on your
                profile.
              </span>
            </div>

            <FormAlert>{error}</FormAlert>

            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                className="h-11"
                disabled={!formValid || submitting}
                onClick={() => void submit('immediate')}
              >
                {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
                Confirm — end today
              </Button>
              <Button
                variant="ghost"
                className="h-11"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </DialogContent>
  );
}

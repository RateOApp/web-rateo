'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Search, Star } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { FieldShell } from '@/components/auth/text-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJobCategories } from '@/hooks/use-jobs';
import { getApiErrorMessage } from '@/lib/api/errors';
import { INDUSTRIES } from '@/lib/constants/industries';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';
import type { JobPreferencesPayload } from '@/types/profile';
import { cn } from '@/lib/utils';

const MAX_CATEGORIES = 3;
const DEFAULT_MIN_RATING = 3;

/**
 * Seeds from the array shape when present, else folds the legacy single
 * `category` string into a one-item array - the same back-compat fold the
 * server does, so an old account keeps its existing pick.
 */
function seedCategories(user: User): string[] {
  const saved = user.jobPreferences?.categories;
  if (Array.isArray(saved) && saved.length > 0) return saved;
  const legacy = (user.jobPreferences as { category?: string } | undefined)?.category;
  return legacy ? [legacy] : [];
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Job preferences in two steps: pick up to three industries, then describe the
 * role. They drive the personalised feed - `GET /jobs` with no `categories`
 * param reads them server-side - so `category` is kept in sync with
 * `categories[0]` for the readers that still use the legacy field.
 */
export function JobPreferencesWizard({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categoryData, isLoading: countsLoading } = useJobCategories();

  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>(() => seedCategories(user));
  const [search, setSearch] = useState('');

  const [jobTitle, setJobTitle] = useState(user.jobPreferences?.jobTitle ?? '');
  const [location, setLocation] = useState(user.jobPreferences?.location ?? '');
  const [minSalary, setMinSalary] = useState(
    user.jobPreferences?.minSalary != null ? String(user.jobPreferences.minSalary) : '',
  );
  const [maxSalary, setMaxSalary] = useState(
    user.jobPreferences?.maxSalary != null ? String(user.jobPreferences.maxSalary) : '',
  );
  const [minRating, setMinRating] = useState(
    user.jobPreferences?.minRating || DEFAULT_MIN_RATING,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The full canonical list with REAL open-job counts merged in. The endpoint
   * only returns industries that currently have at least one open job, so
   * anything missing is a true zero - never a placeholder number.
   */
  const industries = useMemo(() => {
    const counts = new Map(
      (categoryData?.categories ?? []).map((entry) => [entry.industry, entry.count ?? 0]),
    );
    return INDUSTRIES.map((industry) => {
      const count = counts.get(industry) ?? 0;
      return {
        industry,
        label: count === 0 ? 'No open jobs' : `${count} job${count === 1 ? '' : 's'}`,
      };
    });
  }, [categoryData]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return industries;
    return industries.filter((entry) => entry.industry.toLowerCase().includes(needle));
  }, [industries, search]);

  function toggle(industry: string) {
    setSelected((current) => {
      if (current.includes(industry)) return current.filter((entry) => entry !== industry);
      if (current.length >= MAX_CATEGORIES) {
        toast.error('Limit reached', { description: 'You can choose up to 3 industries.' });
        return current;
      }
      return [...current, industry];
    });
  }

  async function handleSave() {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      // Typed separately so the legacy `category` survives: `JobPreferences`
      // does not declare it, and an inline literal would be rejected as an
      // excess property.
      const preferences: JobPreferencesPayload = {
        categories: selected,
        category: selected[0] ?? '',
        jobTitle: jobTitle.trim(),
        location: location.trim(),
        minSalary: toNumber(minSalary),
        maxSalary: toNumber(maxSalary),
        minRating,
      };
      await usersService.updateProfile({ jobPreferences: preferences });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.refresh();
      toast.success('Preferences updated successfully');
      router.push('/dashboard/profile');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to update your preferences'));
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900">
            What field would you like to see jobs in?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selected {selected.length} of {MAX_CATEGORIES}
          </p>
        </div>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            placeholder="Search"
            aria-label="Search industries"
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-9"
          />
        </div>

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No industries match &ldquo;{search.trim()}&rdquo;.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {visible.map((entry) => {
              const active = selected.includes(entry.industry);
              return (
                <li key={entry.industry}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(entry.industry)}
                    className={cn(
                      'flex h-full w-full flex-col rounded-2xl border p-3 text-left transition-colors',
                      active
                        ? 'border-brand-700 bg-brand-50'
                        : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-brand-900">{entry.industry}</span>
                      {active ? (
                        <Check aria-hidden="true" className="size-4 shrink-0 text-brand-700" />
                      ) : null}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {countsLoading ? '…' : entry.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          className="h-11 w-full bg-brand-700 text-white"
          disabled={selected.length === 0}
          onClick={() => setStep(2)}
        >
          Next
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <Label className="text-brand-900">Category</Label>
        <div className="flex flex-wrap gap-2">
          {selected.map((category) => (
            <span
              key={category}
              className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <FieldShell id="pref-title" label="Job description">
        <Input
          id="pref-title"
          value={jobTitle}
          placeholder="e.g. Software Engineer"
          disabled={saving}
          onChange={(event) => setJobTitle(event.target.value)}
          className="h-11"
        />
      </FieldShell>

      <FieldShell id="pref-location" label="Location">
        <Input
          id="pref-location"
          value={location}
          placeholder="e.g. Lagos, Nigeria"
          disabled={saving}
          onChange={(event) => setLocation(event.target.value)}
          className="h-11"
        />
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell id="pref-min-salary" label="Min. salary">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input px-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span aria-hidden="true" className="text-sm font-medium text-muted-foreground">
              ₦
            </span>
            <input
              id="pref-min-salary"
              value={minSalary}
              inputMode="numeric"
              disabled={saving}
              onChange={(event) => setMinSalary(event.target.value.replace(/[^\d,]/g, ''))}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-brand-900 outline-none"
            />
          </div>
        </FieldShell>

        <FieldShell id="pref-max-salary" label="Max. salary">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input px-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span aria-hidden="true" className="text-sm font-medium text-muted-foreground">
              ₦
            </span>
            <input
              id="pref-max-salary"
              value={maxSalary}
              inputMode="numeric"
              disabled={saving}
              onChange={(event) => setMaxSalary(event.target.value.replace(/[^\d,]/g, ''))}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-brand-900 outline-none"
            />
          </div>
        </FieldShell>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-brand-900">Minimum company rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? '' : 's'} minimum`}
              aria-pressed={value <= minRating}
              disabled={saving}
              onClick={() => setMinRating(value)}
              className="rounded-md p-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Star
                aria-hidden="true"
                className={cn(
                  'size-7',
                  value <= minRating ? 'fill-star text-star' : 'text-gray-400/50',
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <FormAlert>{error}</FormAlert>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          className="h-11 flex-1 bg-brand-700 text-white"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
          Save changes
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1"
          disabled={saving}
          onClick={() => setStep(1)}
        >
          Back
        </Button>
      </div>
    </div>
  );
}

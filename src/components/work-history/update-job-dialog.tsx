'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { FieldShell } from '@/components/auth/text-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/errors';
import { usersService } from '@/services/users';
import type { Experience, User } from '@/types/api';
import type { WorkHistoryItem } from '@/types/profile';

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

type UpdateJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  /** `null` adds a new entry; otherwise the row being edited. */
  item: WorkHistoryItem | null;
};

/**
 * Add or edit one work-history entry.
 *
 * `PUT /users/profile` replaces the whole `experience` array, so the save
 * rebuilds it from `user.experience` and only touches the target entry - the
 * untouched ones keep their `_id`, which is what carries `isVerified`,
 * `companyId` and the end-of-contract record. Rebuilding from the flattened
 * work-history rows instead would quietly strip all of that.
 *
 * An existing entry's employer is fixed: a user must not be able to rename the
 * company they worked for, because that record may be company-verified.
 *
 * The form is mounted only while the dialog is open, so it always seeds from
 * the row being edited instead of the previous one.
 */
export function UpdateJobDialog({ open, onOpenChange, user, item }: UpdateJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <UpdateJobBody onOpenChange={onOpenChange} user={user} item={item} /> : null}
    </Dialog>
  );
}

function UpdateJobBody({ onOpenChange, user, item }: Omit<UpdateJobDialogProps, 'open'>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isEditing = item !== null;

  const [company, setCompany] = useState(item?.company ?? '');
  const [role, setRole] = useState(item?.title ?? '');
  const [startDate, setStartDate] = useState(() => toDateInputValue(item?.startDate));
  const [endDate, setEndDate] = useState(() => toDateInputValue(item?.endDate));
  const [current, setCurrent] = useState(item?.current === true);
  const [description, setDescription] = useState(item?.description ?? '');
  const [saving, setSaving] = useState<'save' | 'remove' | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Where this row sits in `user.experience`. The controller projects the
   * subdocument `_id` as `id`, so that is the reliable key; the
   * company + title pair is a fallback for older records without one.
   */
  const index = useMemo(() => {
    if (!item) return -1;
    const list = user.experience ?? [];
    const byId = list.findIndex((entry) => entry._id && entry._id === item.id);
    if (byId >= 0) return byId;
    return list.findIndex((entry) => entry.company === item.company && entry.title === item.title);
  }, [item, user.experience]);

  async function persist(experience: Experience[]) {
    await usersService.updateProfile({ experience });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['workHistory', user._id] }),
    ]);
    router.refresh();
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!company.trim() || !role.trim() || !startDate) {
      setError('Please fill in all required fields (Company, Role, Start Date)');
      return;
    }

    setError(null);
    setSaving('save');
    try {
      const patch: Experience = {
        company: company.trim(),
        title: role.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: current ? null : endDate ? new Date(endDate).toISOString() : null,
        current,
        description: description.trim(),
      };

      const list = [...(user.experience ?? [])];
      if (index >= 0) list[index] = { ...list[index], ...patch };
      else list.push(patch);

      await persist(list);
      onOpenChange(false);
      toast.success(isEditing ? 'Experience updated' : 'Experience added');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to update experience'));
    } finally {
      setSaving(null);
    }
  }

  async function handleRemove() {
    if (index < 0 || saving) return;
    setError(null);
    setSaving('remove');
    try {
      const list = (user.experience ?? []).filter((_, i) => i !== index);
      await persist(list);
      onOpenChange(false);
      toast.success('Experience removed');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to remove experience'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Update job' : 'Add job'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the role, dates and description of this experience.'
            : 'Add a role you have held so employers can see your history.'}
        </DialogDescription>
      </DialogHeader>

      {confirmRemove ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-brand-900">Remove Experience?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to remove this experience from your profile?
            </p>
          </div>
          <FormAlert>{error}</FormAlert>
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              className="h-11"
              disabled={saving !== null}
              onClick={() => void handleRemove()}
            >
              {saving === 'remove' ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Yes, Remove
            </Button>
            <Button
              variant="ghost"
              className="h-11"
              disabled={saving !== null}
              onClick={() => setConfirmRemove(false)}
            >
              No, Cancel
            </Button>
          </div>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <FieldShell id="job-company" label="Company">
            <Input
              id="job-company"
              value={company}
              readOnly={isEditing}
              disabled={saving !== null}
              placeholder="Company Name"
              onChange={(event) => setCompany(event.target.value)}
              className={isEditing ? 'h-11 bg-muted text-muted-foreground' : 'h-11'}
            />
            {isEditing ? (
              <p className="text-xs text-muted-foreground">Company name can&rsquo;t be changed.</p>
            ) : null}
          </FieldShell>

          <FieldShell id="job-role" label="Role">
            <Input
              id="job-role"
              value={role}
              disabled={saving !== null}
              placeholder="Software Engineer"
              onChange={(event) => setRole(event.target.value)}
              className="h-11"
            />
          </FieldShell>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell id="job-start" label="Start date">
              <Input
                id="job-start"
                type="date"
                value={startDate}
                disabled={saving !== null}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11"
              />
            </FieldShell>

            {current ? null : (
              <FieldShell id="job-end" label="End date">
                <Input
                  id="job-end"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  disabled={saving !== null}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-11"
                />
              </FieldShell>
            )}
          </div>

          <FieldShell id="job-description" label="Description of your role">
            <Textarea
              id="job-description"
              value={description}
              rows={4}
              disabled={saving !== null}
              placeholder="What did you do in this role? Companies viewing your profile see this."
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 rounded-xl"
            />
          </FieldShell>

          <label className="flex items-center gap-2 text-sm text-brand-900">
            <Checkbox
              checked={current}
              disabled={saving !== null}
              onCheckedChange={(checked) => setCurrent(checked === true)}
            />
            I currently work here
          </label>

          <FormAlert>{error}</FormAlert>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="h-11 bg-brand-700 text-white"
              disabled={saving !== null}
            >
              {saving === 'save' ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Save changes
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-destructive hover:bg-destructive/10"
                disabled={saving !== null}
                onClick={() => setConfirmRemove(true)}
              >
                Remove Experience
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </DialogContent>
  );
}

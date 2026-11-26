'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  addSkillsFromText,
  MAX_SKILL_LENGTH,
  MAX_SKILLS,
  splitSkillList,
  splitSkillText,
} from '@/lib/skills';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';

/** Moves `from` to `to`, returning a new array. Out-of-range moves are no-ops. */
function move(list: string[], from: number, to: number): string[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item === undefined) return list;
  next.splice(to, 0, item);
  return next;
}

/**
 * Skills list: add, remove, reorder.
 *
 * Order matters (it is what a company sees first), so the mobile drag handle
 * becomes a pair of up/down buttons here - keyboard-reachable, no drag library,
 * and no pointer-precision requirement on a phone.
 */
export function SkillsEditor({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [skills, setSkills] = useState<string[]>(() => splitSkillList(user.skills));
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addError, setAddError] = useState<string | null>(null);

  // A single entry over the cap; a comma-separated list may be longer overall.
  const longestDraftSkill = Math.max(0, ...splitSkillText(draft).map((skill) => skill.length));
  const draftOverLimit = longestDraftSkill > MAX_SKILL_LENGTH;
  const atCap = skills.length >= MAX_SKILLS;

  function addSkill() {
    if (!draft.trim()) return;
    const result = addSkillsFromText(skills, draft);
    if (result.error) {
      setAddError(result.error);
      return;
    }
    setSkills(result.skills);
    setAddError(null);
    setDraft('');
  }

  async function handleSave() {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await usersService.updateProfile({ skills });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.refresh();
      toast.success('Skills updated successfully');
      router.push('/dashboard/profile');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to update your skills'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <Label htmlFor="new-skill" className="text-brand-900">
          Add a new skill
        </Label>
        <div className="flex gap-2">
          <Input
            id="new-skill"
            value={draft}
            placeholder={atCap ? `Maximum of ${MAX_SKILLS} skills reached` : 'e.g. Payroll'}
            disabled={saving || atCap}
            aria-describedby="new-skill-hint"
            aria-invalid={draftOverLimit || undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              if (addError) setAddError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSkill();
              }
            }}
            className="h-11"
          />
          <Button
            type="button"
            className="h-11 shrink-0 bg-brand-700 px-5 text-white"
            disabled={!draft.trim() || draftOverLimit || saving || atCap}
            onClick={addSkill}
          >
            Add
          </Button>
        </div>
        <div className="flex items-start justify-between gap-3 text-xs">
          <p
            id="new-skill-hint"
            className={addError || draftOverLimit ? 'text-destructive' : 'text-muted-foreground'}
          >
            {addError ??
              (draftOverLimit
                ? `Keep each skill under ${MAX_SKILL_LENGTH} characters. Separate several skills with commas.`
                : 'One skill at a time, e.g. “Payroll”. Separate several with commas.')}
          </p>
          <span
            className={`shrink-0 tabular-nums ${draftOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {draft.trim()
              ? `${longestDraftSkill}/${MAX_SKILL_LENGTH}`
              : `${skills.length}/${MAX_SKILLS} skills`}
          </span>
        </div>
      </div>

      {skills.length === 0 ? (
        <EmptyState
          title="No skills added"
          description="Add the skills you want employers to see first."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {skills.map((skill, index) => (
            <li
              key={`${skill}-${index}`}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-900">
                {skill}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${skill} up`}
                disabled={index === 0 || saving}
                onClick={() => setSkills((current) => move(current, index, index - 1))}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${skill} down`}
                disabled={index === skills.length - 1 || saving}
                onClick={() => setSkills((current) => move(current, index, index + 1))}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${skill}`}
                disabled={saving}
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setSkills((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FormAlert>{error}</FormAlert>

      <Button
        type="button"
        className="h-11 w-full bg-brand-700 text-white"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
        Save
      </Button>
    </div>
  );
}

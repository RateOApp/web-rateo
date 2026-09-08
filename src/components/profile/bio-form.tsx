'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/errors';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';
import { cn } from '@/lib/utils';

const MAX_WORDS = 100;

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

type BioField = 'bio' | 'description';

const COPY: Record<BioField, { placeholder: string; toast: string; label: string }> = {
  bio: {
    placeholder: 'Write something about yourself...',
    toast: 'Bio updated successfully',
    label: 'Bio',
  },
  description: {
    placeholder: 'Write something about your company...',
    toast: 'About updated successfully',
    label: 'About your company',
  },
};

/**
 * The 100-word "about" editor, shared by both roles.
 *
 * The two roles write DIFFERENT columns: individuals have `bio`, companies have
 * `description` (which is what candidates read on the public company page).
 * Sending the wrong one silently writes a field nothing renders, so the field
 * is an explicit prop rather than inferred from `user.role` - the caller is the
 * route branch and already knows.
 */
export function BioForm({ user, field = 'bio' }: { user: User; field?: BioField }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const copy = COPY[field];
  const [bio, setBio] = useState((field === 'bio' ? user.bio : user.description) ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordsLeft = MAX_WORDS - wordCount(bio);
  const overLimit = wordsLeft < 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || overLimit) return;

    setError(null);
    setSaving(true);
    try {
      await usersService.updateProfile({ [field]: bio });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.refresh();
      toast.success(copy.toast);
      router.push('/dashboard/profile');
    } catch (caught) {
      setError(getApiErrorMessage(caught, `Failed to update your ${field}`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6"
    >
      <Textarea
        id="bio"
        value={bio}
        rows={8}
        disabled={saving}
        aria-label={copy.label}
        aria-invalid={overLimit || undefined}
        placeholder={copy.placeholder}
        onChange={(event) => setBio(event.target.value)}
        className="min-h-40 rounded-xl"
      />
      <p
        className={cn(
          'text-right text-xs',
          overLimit ? 'font-medium text-destructive' : 'text-muted-foreground',
        )}
      >
        {wordsLeft} words left
      </p>

      <FormAlert>{error}</FormAlert>

      <Button
        type="submit"
        className="h-11 w-full bg-brand-700 text-white"
        disabled={saving || overLimit}
      >
        {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
        Done
      </Button>
    </form>
  );
}

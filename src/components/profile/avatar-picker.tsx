'use client';

import { useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';

import { UserAvatar } from '@/components/shared/user-avatar';
import { getApiErrorMessage } from '@/lib/api/errors';
import { LOGO_MAX_BYTES, LOGO_MIME_TYPES } from '@/lib/constants/company';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';
import { cn } from '@/lib/utils';

type AvatarPickerProps = {
  /** Used only for the initials fallback and the alt text. */
  user: Pick<User, 'firstName' | 'lastName' | 'companyName'>;
  /** Hosted avatar URL, or `null` while the account has none. */
  value: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Avatar upload. The file goes straight to `POST /users/avatar` (multipart
 * field `image`), which answers with the Cloudinary URL only - the parent form
 * then carries that URL into its own `PUT /users/profile` save, exactly like
 * the mobile screen. Storing base64 in the profile is what bloated every list
 * payload before the upload endpoint existed.
 */
export function AvatarPicker({ user, value, onChange, disabled, className }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!(LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError('Please choose a PNG, JPEG or WebP image.');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError('Please choose an image smaller than 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const { avatar } = await usersService.uploadAvatar(file);
      if (avatar) onChange(avatar);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Upload failed'));
    } finally {
      setUploading(false);
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        <UserAvatar user={{ ...user, avatar: value ?? undefined }} className="size-24 [&_[data-slot=avatar-fallback]]:text-2xl" />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile photo"
          className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full border border-border bg-card text-brand-700 shadow-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Pencil aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_MIME_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

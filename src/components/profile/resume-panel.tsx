'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar, displayName } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useResume } from '@/hooks/use-resume';
import { useWorkHistory } from '@/hooks/use-work-history';
import { getApiErrorMessage } from '@/lib/api/errors';
import { toDate } from '@/lib/format';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';

const MAX_BYTES = 5 * 1024 * 1024;
const PDF_MIME = 'application/pdf';

/**
 * Whether the browser will render the file inline. Cloudinary serves PDFs from
 * its `raw` delivery type without an extension, so match that too.
 */
function isInlinePdf(url: string): boolean {
  const clean = url.split('?')[0]?.toLowerCase() ?? '';
  return clean.endsWith('.pdf') || /res\.cloudinary\.com\/.+\/raw\//.test(clean);
}

function monthYear(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? `${date.getMonth() + 1}/${date.getFullYear()}` : '';
}

/** My Resume: the stored PDF plus the read-only profile summary beside it. */
export function ResumePanel({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useResume(user._id);
  const { data: history, isLoading: historyLoading } = useWorkHistory(user._id);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeUrl = data?.resume ?? null;
  const items = useMemo(() => history ?? [], [history]);
  const currentJob = items.find((item) => item.current) ?? items[0];
  const title = currentJob?.title || user.jobPreferences?.jobTitle || 'Job Seeker';

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['resume', user._id] }),
      queryClient.invalidateQueries({ queryKey: ['me'] }),
    ]);
    router.refresh();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (file.type !== PDF_MIME) {
      setError('Please choose a PDF file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File too large. Please select a PDF smaller than 5MB.');
      return;
    }

    setUploading(true);
    try {
      await usersService.uploadResume(user._id, file);
      await refresh();
      toast.success('Your resume has been uploaded.');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await usersService.deleteResume(user._id);
      await refresh();
      setConfirmDelete(false);
      toast.success('Resume deleted');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not delete your resume'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---- the file ---------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-brand-900">My Resume / CV</h2>

        {isLoading ? (
          <Skeleton className="mt-3 h-16 w-full rounded-xl" />
        ) : resumeUrl ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
            >
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-900">My Resume</p>
              <p className="text-xs text-muted-foreground">PDF · opens in a new tab</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" />
                  View
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <RefreshCw aria-hidden="true" />
                )}
                Replace
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete resume"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">No resume uploaded.</p>
            <Button
              variant="outline"
              className="mt-3 h-11"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <UploadCloud aria-hidden="true" />
              )}
              Upload CV / Resume (PDF)
            </Button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        {error ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        {resumeUrl && isInlinePdf(resumeUrl) ? (
          <iframe
            src={resumeUrl}
            title="Resume preview"
            className="mt-4 h-96 w-full rounded-xl border border-border md:h-160"
          />
        ) : null}
      </section>

      {/* ---- read-only summary ------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-brand-900">{displayName(user)}</p>
            {user.publicId ? (
              <p className="text-xs text-muted-foreground">ID-{user.publicId}</p>
            ) : null}
            <p className="truncate text-sm text-muted-foreground">{title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.location || 'No location set'}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand-900">About me</h3>
          <p className="mt-1 text-sm text-muted-foreground">{user.bio || 'No bio added yet.'}</p>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand-900">Skills</h3>
          {user.skills?.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <li
                  key={`${skill}-${index}`}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No skills added</p>
          )}
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand-900">Work experience</h3>
          {historyLoading ? (
            <Skeleton className="mt-2 h-20 w-full rounded-xl" />
          ) : items.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No work history added yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-3">
              {items.map((item, index) => (
                <li
                  key={item.id ?? `${item.company}-${index}`}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-brand-900">
                      {item.company || 'Unknown company'}
                    </p>
                    {item.current ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase aria-hidden="true" className="size-3.5" />
                      {item.title || 'Role'}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>
                      {monthYear(item.startDate)} –{' '}
                      {item.current ? 'Present' : monthYear(item.endDate)}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-brand-900">
                    {item.description || 'No description provided.'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Dialog open={confirmDelete} onOpenChange={deleting ? undefined : setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete resume</DialogTitle>
            <DialogDescription>Are you sure you want to remove your resume?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

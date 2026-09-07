'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SuggestInput } from '@/components/setup/suggest-input';
import { WizardShell } from '@/components/setup/wizard-shell';
import {
  ABOUT_MAX,
  aboutSchema,
  addressSchema,
  companyNameSchema,
  firstIssue,
  industrySchema,
  logoFileSchema,
} from '@/components/setup/schemas';
import { LOGO_MIME_TYPES } from '@/lib/constants/company';
import { INDUSTRIES } from '@/lib/constants/industries';
import { getApiErrorMessage } from '@/lib/api/errors';
import { hardNavigate } from '@/lib/navigate';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';

type StepId = 'name' | 'industry' | 'logo' | 'address' | 'about';

const HEADINGS: Record<StepId, { title: string; description: string }> = {
  name: {
    title: "What's your company name?",
    description: 'This is how candidates will find you on Rate’O.',
  },
  industry: {
    title: 'Which industry does your company operate in?',
    description: 'Pick the closest match from the list.',
  },
  logo: {
    title: 'Upload your company logo',
    description: 'A square PNG, JPG or WebP under 5MB works best.',
  },
  address: {
    title: "What is your company's address?",
    description: 'Where your team is based.',
  },
  about: {
    title: 'About your company',
    description: 'A short introduction shown on your profile and job posts.',
  },
};

export function CompanySetup({
  user,
  /** Escape hatch for visual QA only; production always starts at step 1. */
  initialStep = 1,
}: {
  user: User;
  initialStep?: number;
}) {
  // Social signups arrive with no company name -> collect it first. Email
  // signups already sent it at registration and skip straight to industry.
  const needsCompanyName = !user.companyName?.trim();

  const steps = useMemo<StepId[]>(
    () =>
      needsCompanyName
        ? ['name', 'industry', 'logo', 'address', 'about']
        : ['industry', 'logo', 'address', 'about'],
    [needsCompanyName],
  );

  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialStep, 1), steps.length) - 1,
  );
  const current = steps[index] ?? 'industry';

  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [skipLogoOpen, setSkipLogoOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Object URLs leak until revoked. They are created in the change handler (not
  // an effect) so picking a file costs exactly one render, and the ref lets the
  // unmount cleanup revoke whichever one is still live.
  const previewRef = useRef<string | null>(null);

  function selectLogo(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setLogoFile(file);
    setPreviewUrl(previewRef.current);
    // A new file (or clearing it) invalidates any URL we already uploaded.
    setUploadedUrl(null);
  }

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const industrySuggestions = useMemo(() => {
    const needle = industry.trim().toLowerCase();
    if (!needle) return INDUSTRIES;
    return INDUSTRIES.filter((entry) => entry.toLowerCase().includes(needle));
  }, [industry]);

  function goTo(next: number) {
    setError(null);
    setIndex(next);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    const parsed = logoFileSchema.safeParse(file);
    if (!parsed.success) {
      setError(firstIssue(parsed));
      return;
    }
    setError(null);
    selectLogo(file);
  }

  function clearFile() {
    selectLogo(null);
    setError(null);
  }

  async function advanceFromLogo() {
    if (logoFile && !uploadedUrl) {
      setUploading(true);
      try {
        const { avatar } = await usersService.uploadAvatar(logoFile);
        setUploadedUrl(avatar);
      } catch (uploadError) {
        setError(getApiErrorMessage(uploadError, 'Could not upload that image. Please try again.'));
        return;
      } finally {
        setUploading(false);
      }
    } else if (!logoFile && !uploadedUrl && !user.avatar) {
      setSkipLogoOpen(true);
      return;
    }
    goTo(index + 1);
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      await usersService.updateProfile({
        companyName: companyName.trim(),
        industry,
        address: address.trim(),
        description: about.trim(),
        ...(uploadedUrl ? { avatar: uploadedUrl } : {}),
        setupCompleted: true,
      });

      // A full navigation, not a router push: the dashboard's server layout has
      // to re-read the profile before its `setupCompleted === false` guard runs.
      hardNavigate('/dashboard');
    } catch (submitError) {
      setSubmitting(false);
      toast.error(getApiErrorMessage(submitError, 'Could not finish setup. Please try again.'));
    }
  }

  function handleContinue() {
    if (current === 'name') {
      const parsed = companyNameSchema.safeParse(companyName);
      if (!parsed.success) {
        setError(firstIssue(parsed));
        return;
      }
      goTo(index + 1);
      return;
    }

    if (current === 'industry') {
      const parsed = industrySchema.safeParse(industry);
      if (!parsed.success) {
        setError(firstIssue(parsed));
        return;
      }
      goTo(index + 1);
      return;
    }

    if (current === 'logo') {
      void advanceFromLogo();
      return;
    }

    if (current === 'address') {
      const parsed = addressSchema.safeParse(address);
      if (!parsed.success) {
        setError(firstIssue(parsed));
        return;
      }
      goTo(index + 1);
      return;
    }

    const parsed = aboutSchema.safeParse(about);
    if (!parsed.success) {
      setError(firstIssue(parsed));
      return;
    }
    setError(null);
    void handleFinish();
  }

  const heading = HEADINGS[current];
  const errorId = error ? 'setup-error' : undefined;
  const logoSrc = previewUrl ?? uploadedUrl ?? user.avatar ?? null;

  return (
    <>
      <WizardShell
        step={index + 1}
        total={steps.length}
        title={heading.title}
        description={heading.description}
        onBack={index > 0 ? () => goTo(index - 1) : undefined}
        onContinue={handleContinue}
        busy={submitting}
        continueBusy={uploading}
        continueLabel={uploading ? 'Uploading' : undefined}
      >
        {current === 'name' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={companyName}
              placeholder="Enter your company name"
              autoComplete="organization"
              className="h-11 rounded-xl"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={errorId}
              onChange={(event) => {
                setCompanyName(event.target.value);
                setError(null);
              }}
            />
          </div>
        ) : null}

        {current === 'industry' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="industry">Industry</Label>
            <SuggestInput
              id="industry"
              value={industry}
              onValueChange={(value) => {
                setIndustry(value);
                setError(null);
              }}
              onSelect={(entry) => {
                setIndustry(entry);
                setError(null);
              }}
              items={industrySuggestions}
              itemKey={(entry) => entry}
              renderItem={(entry) => entry}
              placeholder="Choose an industry"
              invalid={Boolean(error)}
              describedBy={errorId ?? 'industry-hint'}
            />
            {error ? null : (
              <p id="industry-hint" className="text-xs text-muted-foreground">
                Pick an industry from the list &mdash; free text is not accepted.
              </p>
            )}
          </div>
        ) : null}

        {current === 'logo' ? (
          <div className="flex flex-col gap-3">
            <Label
              htmlFor="logo"
              className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-cream-50 px-4 py-8 text-center transition-colors hover:border-brand-700"
            >
              {logoSrc ? (
                // A blob: URL cannot go through next/image's optimizer, and the
                // uploaded logo is a remote Cloudinary URL that is not in the
                // image config either - a plain <img> is the right primitive.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt="Company logo preview"
                  className="size-24 rounded-2xl border border-border bg-card object-contain"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-24 items-center justify-center rounded-2xl border border-border bg-card text-brand-700"
                >
                  <ImageIcon className="size-8" />
                </span>
              )}

              <span className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <UploadCloud aria-hidden="true" className="size-4" />
                {logoSrc ? 'Change image' : 'Upload logo'}
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG or WebP &middot; up to 5MB
              </span>

              <input
                id="logo"
                type="file"
                accept={LOGO_MIME_TYPES.join(',')}
                className="sr-only"
                aria-describedby={errorId}
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  // Allow re-picking the same file after a validation error.
                  event.target.value = '';
                }}
              />
            </Label>

            {logoFile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
                <span className="min-w-0 truncate text-sm text-brand-900">{logoFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove selected logo"
                  onClick={clearFile}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {current === 'address' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Company address</Label>
            <Textarea
              id="address"
              value={address}
              rows={3}
              placeholder="Enter full address"
              className="min-h-24 rounded-xl"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={errorId}
              onChange={(event) => {
                setAddress(event.target.value);
                setError(null);
              }}
            />
          </div>
        ) : null}

        {current === 'about' ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="about">About us</Label>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {about.length}/{ABOUT_MAX}
              </span>
            </div>
            <Textarea
              id="about"
              value={about}
              rows={6}
              maxLength={ABOUT_MAX}
              placeholder="Feel free to include details about what the company does, its core values and what set it apart."
              className="min-h-36 rounded-xl"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={errorId}
              onChange={(event) => {
                setAbout(event.target.value);
                setError(null);
              }}
            />
          </div>
        ) : null}

        {error ? (
          <p id="setup-error" role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </WizardShell>

      <Dialog open={skipLogoOpen} onOpenChange={setSkipLogoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue without logo?</DialogTitle>
            <DialogDescription>
              Are you sure you want to continue without uploading a company logo?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => setSkipLogoOpen(false)}
            >
              No
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-11 bg-brand-700 text-white"
              onClick={() => {
                setSkipLogoOpen(false);
                goTo(index + 1);
              }}
            >
              Yes, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

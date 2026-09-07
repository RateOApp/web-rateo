'use client';

import { useMemo, useState } from 'react';
import { Check, Info, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SuggestInput } from '@/components/setup/suggest-input';
import { WizardShell } from '@/components/setup/wizard-shell';
import {
  employerSchema,
  firstIssue,
  inviteEmailSchema,
  jobTitleSchema,
  nameSchema,
} from '@/components/setup/schemas';
import { useCompanySearch } from '@/hooks/use-company-search';
import { UNEMPLOYED_LABEL } from '@/lib/constants/company';
import { JOB_TITLES } from '@/lib/constants/job-titles';
import { DEFAULT_WORK_LOCATION, WORK_LOCATIONS } from '@/lib/constants/locations';
import { getApiErrorMessage } from '@/lib/api/errors';
import { hardNavigate } from '@/lib/navigate';
import { invitationsService } from '@/services/invitations';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';

const TOTAL_STEPS = 3;

type Errors = Partial<Record<'firstName' | 'lastName' | 'jobTitle' | 'company', string>>;

/**
 * Social signups (Apple especially) arrive nameless; the server then stores a
 * placeholder - `'User'` or the email's local part - and leaves `lastName`
 * blank. Detect exactly that shape, and only then ask for the real name.
 * Mirrors `IndividualSetupScreen.js`.
 */
function computeNeedsName(user: User): boolean {
  const emailPrefix = String(user.email ?? '').split('@')[0] ?? '';
  const first = String(user.firstName ?? '').trim();
  const last = String(user.lastName ?? '').trim();
  return !last && (!first || user.firstName === 'User' || user.firstName === emailPrefix);
}

export function IndividualSetup({
  user,
  /** Escape hatch for visual QA only; production always starts at step 1. */
  initialStep = 1,
}: {
  user: User;
  initialStep?: number;
}) {
  const needsName = useMemo(() => computeNeedsName(user), [user]);

  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState<Errors>({});

  const [firstName, setFirstName] = useState(needsName ? '' : (user.firstName ?? ''));
  const [lastName, setLastName] = useState(needsName ? '' : (user.lastName ?? ''));
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState<string>(DEFAULT_WORK_LOCATION);

  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isUnemployed, setIsUnemployed] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const jobSuggestions = useMemo(() => {
    const needle = jobTitle.trim().toLowerCase();
    if (!needle) return JOB_TITLES;
    return JOB_TITLES.filter((title) => title.toLowerCase().includes(needle));
  }, [jobTitle]);

  // The hook debounces internally; an empty keyword disables the query, so the
  // "not employed" branch costs nothing.
  const { companies, isFetching } = useCompanySearch(isUnemployed ? '' : companyName);
  const companySuggestions = companyId ? [] : companies;

  const typedCompany = !isUnemployed && companyName.trim().length > 0;
  const unknownCompany = typedCompany && !companyId && !isFetching && companySuggestions.length === 0;

  function clearError(field: keyof Errors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleCompanyChange(value: string) {
    setCompanyName(value);
    // Typing after a pick breaks the link: the id no longer describes the text.
    setCompanyId(null);
    setInviteSent(false);
    clearError('company');
  }

  function toggleUnemployed(checked: boolean) {
    setIsUnemployed(checked);
    setCompanyId(null);
    setInviteSent(false);
    setCompanyName(checked ? UNEMPLOYED_LABEL : '');
    clearError('company');
  }

  function handleContinue() {
    if (step === 1) {
      const next: Errors = {};
      if (needsName) {
        const parsed = nameSchema.safeParse({ firstName, lastName });
        if (!parsed.success) {
          const message = firstIssue(parsed) ?? '';
          if (!firstName.trim()) next.firstName = message;
          if (!lastName.trim()) next.lastName = message;
        }
      }
      const title = jobTitleSchema.safeParse(jobTitle);
      if (!title.success) next.jobTitle = firstIssue(title) ?? undefined;

      if (Object.values(next).some(Boolean)) {
        setErrors(next);
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (!isUnemployed) {
      const parsed = employerSchema.safeParse(companyName);
      if (!parsed.success) {
        setErrors({ company: firstIssue(parsed) ?? undefined });
        return;
      }
    }
    setErrors({});
    setConfirmOpen(true);
  }

  async function handleInvite() {
    const parsed = inviteEmailSchema.safeParse(inviteEmail);
    if (!parsed.success) {
      setInviteError(firstIssue(parsed));
      return;
    }

    setInviteError(null);
    setInviting(true);
    try {
      const result = await invitationsService.inviteCompany(parsed.data, companyName);
      setInviteOpen(false);

      if (result.companyExists && result.companyId) {
        // That address already belongs to a registered company - link to it
        // exactly as if the user had picked it from the suggestions.
        setCompanyId(result.companyId);
        if (result.companyName) setCompanyName(result.companyName);
        toast.success(
          `${result.companyName || 'This company'} is already on Rate'O - we'll ask them to confirm you.`,
        );
        return;
      }

      setInviteSent(true);
      toast.success('Invite sent');
    } catch (error) {
      setInviteError(getApiErrorMessage(error, 'Failed to send invite'));
    } finally {
      setInviting(false);
    }
  }

  async function handleFinish() {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      await usersService.updateProfile({
        location,
        experience: [
          {
            title: jobTitle.trim(),
            company: companyName.trim(),
            ...(companyId ? { companyId } : {}),
            current: true,
            startDate: new Date().toISOString(),
          },
        ],
        setupCompleted: true,
        ...(needsName ? { firstName: firstName.trim(), lastName: lastName.trim() } : {}),
      });

      // A full navigation, not a router push: the dashboard's server layout has
      // to re-read the profile before its `setupCompleted === false` guard runs.
      hardNavigate('/dashboard');
    } catch (error) {
      setSubmitting(false);
      toast.error(getApiErrorMessage(error, 'Could not finish setup. Please try again.'));
    }
  }

  const headings: Record<number, { title: string; description: string }> = {
    1: needsName
      ? {
          title: "Let's set up your profile",
          description: 'Tell us your name and what you do.',
        }
      : {
          title: "What's your job title?",
          description: 'Start typing and pick a suggestion, or enter your own.',
        },
    2: {
      title: 'Where would you like to work?',
      description: 'You can always change this later.',
    },
    3: {
      title: 'Lastly, what company do you work for?',
      description: 'Search for your employer and pick them from the list.',
    },
  };

  const heading = headings[step] ?? headings[1];
  const nameError = errors.firstName ?? errors.lastName ?? null;

  return (
    <>
      <WizardShell
        step={step}
        total={TOTAL_STEPS}
        title={heading.title}
        description={heading.description}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
        onContinue={handleContinue}
        busy={submitting}
      >
        {step === 1 ? (
          <div className="flex flex-col gap-5">
            {needsName ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    autoComplete="given-name"
                    placeholder="First name"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.firstName) || undefined}
                    aria-describedby={nameError ? 'name-error' : undefined}
                    onChange={(event) => {
                      setFirstName(event.target.value);
                      clearError('firstName');
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    autoComplete="family-name"
                    placeholder="Last name"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.lastName) || undefined}
                    aria-describedby={nameError ? 'name-error' : undefined}
                    onChange={(event) => {
                      setLastName(event.target.value);
                      clearError('lastName');
                    }}
                  />
                </div>

                {/* One message for the pair: both fields carry the same rule. */}
                {nameError ? (
                  <p
                    id="name-error"
                    role="alert"
                    className="text-sm text-destructive sm:col-span-2"
                  >
                    {nameError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <SuggestInput
                id="jobTitle"
                value={jobTitle}
                onValueChange={(value) => {
                  setJobTitle(value);
                  clearError('jobTitle');
                }}
                onSelect={(title) => {
                  setJobTitle(title);
                  clearError('jobTitle');
                }}
                items={jobSuggestions}
                itemKey={(title) => title}
                renderItem={(title) => title}
                placeholder="e.g. Software Engineer"
                invalid={Boolean(errors.jobTitle)}
                describedBy={errors.jobTitle ? 'jobTitle-error' : 'jobTitle-hint'}
              />
              {errors.jobTitle ? (
                <p id="jobTitle-error" role="alert" className="text-sm text-destructive">
                  {errors.jobTitle}
                </p>
              ) : (
                <p id="jobTitle-hint" className="text-xs text-muted-foreground">
                  Not on the list? Type your own.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Preferred location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location" className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Choose a location" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                {WORK_LOCATIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              We use this to surface jobs near you first.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Company</Label>
              <SuggestInput
                id="companyName"
                value={companyName}
                onValueChange={handleCompanyChange}
                onSelect={(company) => {
                  setCompanyName(company.companyName ?? '');
                  setCompanyId(company._id);
                  setInviteSent(false);
                  clearError('company');
                }}
                items={companySuggestions}
                itemKey={(company) => company._id}
                renderItem={(company) => (
                  <span className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar user={company} size="sm" className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {company.companyName || 'Unnamed company'}
                      </span>
                      {company.industry ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {company.industry}
                        </span>
                      ) : null}
                    </span>
                  </span>
                )}
                placeholder="Search for your company"
                disabled={isUnemployed}
                loading={isFetching}
                invalid={Boolean(errors.company)}
                describedBy={errors.company ? 'companyName-error' : undefined}
              />
              {errors.company ? (
                <p id="companyName-error" role="alert" className="text-sm text-destructive">
                  {errors.company}
                </p>
              ) : null}
            </div>

            {companyId ? (
              <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-900">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <span>We&rsquo;ll ask them to confirm you as an employee.</span>
              </p>
            ) : null}

            {inviteSent ? (
              <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-900">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <span>
                  Invite sent. Once {companyName.trim() || 'your company'} signs up with that email
                  you&rsquo;ll be connected automatically.
                </span>
              </p>
            ) : unknownCompany ? (
              <div className="flex flex-col gap-2 rounded-xl bg-accent-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm text-brand-900">
                  <Search aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-600" />
                  <span>We couldn&rsquo;t find this company on Rate&rsquo;O</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-9 shrink-0 self-start bg-card sm:self-auto"
                  onClick={() => {
                    setInviteEmail('');
                    setInviteError(null);
                    setInviteOpen(true);
                  }}
                >
                  Send invite
                </Button>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
              <Checkbox
                checked={isUnemployed}
                onCheckedChange={(checked) => toggleUnemployed(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="block font-medium text-brand-900">
                  I&rsquo;m currently not employed
                </span>
                <span className="block text-xs text-muted-foreground">
                  Your work history updates automatically when you accept a role.
                </span>
              </span>
            </label>

            <p className="text-xs leading-relaxed text-muted-foreground">
              By continuing, you agree for us to send your profile to your company for
              confirmation.{' '}
              <button
                type="button"
                className="font-medium text-brand-700 underline underline-offset-2"
                onClick={() => setLearnMoreOpen(true)}
              >
                Learn more
              </button>
            </p>
          </div>
        ) : null}
      </WizardShell>

      {/* Invite dialog ------------------------------------------------- */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite your company</DialogTitle>
            <DialogDescription>
              We&rsquo;ll email {companyName.trim() || 'them'} an invite to join Rate&rsquo;O so
              they can confirm you as an employee.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inviteEmail">Company email</Label>
            <Input
              id="inviteEmail"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="hello@company.com"
              className="h-11 rounded-xl"
              value={inviteEmail}
              aria-invalid={Boolean(inviteError) || undefined}
              aria-describedby={inviteError ? 'inviteEmail-error' : undefined}
              onChange={(event) => {
                setInviteEmail(event.target.value);
                setInviteError(null);
              }}
            />
            {inviteError ? (
              <p id="inviteEmail-error" role="alert" className="text-sm text-destructive">
                {inviteError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => setInviteOpen(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-11 bg-brand-700 text-white"
              onClick={() => void handleInvite()}
              disabled={inviting}
            >
              {inviting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learn more dialog --------------------------------------------- */}
      <Dialog open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How ratings work on Rate&rsquo;O</DialogTitle>
            <DialogDescription>
              Why we send your profile to the company you select.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Your company confirms your employment. Until they do, neither of you can rate the
              other &mdash; ratings on Rate&rsquo;O only exist between people who actually worked
              together.
            </p>
            <p>
              Once they confirm you, ratings between you and your company become visible to each
              other, and your work history updates on your profile.
            </p>
            <p>
              While you are still employed you can see your overall rating, but written comments
              stay hidden until the working relationship ends &mdash; on both sides.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              size="lg"
              className="h-11 bg-brand-700 text-white"
              onClick={() => setLearnMoreOpen(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog ------------------------------------------------ */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-accent-50 text-accent-600"
            >
              <Info className="size-5" />
            </span>
            <DialogTitle>
              {isUnemployed ? 'Confirm Employment Status' : 'Confirm Company Selection'}
            </DialogTitle>
            <DialogDescription>
              {isUnemployed
                ? 'You have indicated that you are currently unemployed. Your work history will update automatically when you accept a new role.'
                : `You have selected “${companyName.trim()}”. This cannot be changed after confirmation.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-11 bg-brand-700 text-white"
              onClick={() => void handleFinish()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

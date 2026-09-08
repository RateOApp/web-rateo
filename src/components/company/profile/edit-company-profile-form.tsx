'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { FormAlert } from '@/components/auth/form-alert';
import { FieldShell } from '@/components/auth/text-field';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { EmailChangeDialog } from '@/components/profile/email-change-dialog';
import { IdRequestDialog, type IdRequestKind } from '@/components/profile/id-request-dialog';
import { SuggestInput } from '@/components/setup/suggest-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api/errors';
import { COMPANY_SIZES } from '@/lib/constants/company';
import { INDUSTRIES, isIndustry } from '@/lib/constants/industries';
import { usersService } from '@/services/users';
import type { User } from '@/types/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatusPill({ tone, children }: { tone: 'pending' | 'approved'; children: string }) {
  const Icon = tone === 'pending' ? Clock : CheckCircle2;
  return (
    <span
      className={
        tone === 'pending'
          ? 'inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600'
          : 'inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success'
      }
    >
      <Icon aria-hidden="true" className="size-3" />
      {children}
    </span>
  );
}

/**
 * Edit company profile.
 *
 * Mirrors the individual editor's rules: only `companyName`, `industry`,
 * `companySize`, `address` and `avatar` go through `PUT /users/profile`. Email
 * and phone are admin- or OTP-gated and would route around that approval if
 * they were in this payload, and `description` belongs to the About editor -
 * sending a stale copy from here would overwrite a fresh edit.
 *
 * The industry is validated only when the user actually touches it: accounts
 * created before the fixed list carry free text, and locking the whole form
 * over a field they did not open would be a dead end.
 */
export function EditCompanyProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [industry, setIndustry] = useState(user.industry ?? '');
  const [industryTouched, setIndustryTouched] = useState(false);
  const [companySize, setCompanySize] = useState(user.companySize ?? '');
  const [address, setAddress] = useState(user.location ?? '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState(user.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const [phone, setPhone] = useState(user.phone ?? user.phone_number ?? '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [idRequest, setIdRequest] = useState<IdRequestKind | null>(null);

  const emailEditable = user.isEmailEditable === true;
  const phoneEditable = user.isPhoneEditable === true;
  const emailPending = Boolean(user.emailEditRequest) && !emailEditable;
  const phonePending = Boolean(user.phoneEditRequest) && !phoneEditable;

  const industryValid = isIndustry(industry);
  const industrySuggestions = useMemo(() => {
    const needle = industry.trim().toLowerCase();
    if (!needle) return INDUSTRIES;
    return INDUSTRIES.filter((entry) => entry.toLowerCase().includes(needle));
  }, [industry]);

  /** Refetch rather than trusting a response - `PUT /users/profile` is partial. */
  async function refreshUser() {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    router.refresh();
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!companyName.trim()) {
      setError('Please enter your company name.');
      return;
    }
    if (industryTouched && !industryValid) {
      setError('Please pick your industry from the list.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await usersService.updateProfile({
        companyName: companyName.trim(),
        industry,
        companySize,
        // The controller aliases `address` onto `user.location` for companies.
        address: address.trim(),
        ...(avatar ? { avatar } : {}),
      });
      await refreshUser();
      toast.success('Profile updated successfully');
      router.push('/dashboard/profile');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to update your profile'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEmail() {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);
    setSavingEmail(true);
    try {
      const result = await usersService.updateEmail(trimmed);
      setEmail(result.email || trimmed);
      await refreshUser();
      toast.success('Your email has been updated.');
    } catch (caught) {
      setEmailError(getApiErrorMessage(caught, 'Failed to update email'));
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSavePhone() {
    const trimmed = phone.trim();
    if (trimmed.length < 6) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }
    setPhoneError(null);
    setSavingPhone(true);
    try {
      const result = await usersService.updatePhone(trimmed);
      setPhone(result.phone || trimmed);
      await refreshUser();
      toast.success('Your phone number has been updated.');
    } catch (caught) {
      setPhoneError(getApiErrorMessage(caught, 'Failed to update phone'));
    } finally {
      setSavingPhone(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6"
      >
        <AvatarPicker
          user={user}
          value={avatar}
          onChange={setAvatar}
          disabled={saving}
          className="self-center"
        />

        <FieldShell id="company-name" label="Company name">
          <Input
            id="company-name"
            value={companyName}
            autoComplete="organization"
            placeholder="Rate'O Limited"
            disabled={saving}
            onChange={(event) => setCompanyName(event.target.value)}
            className="h-11"
          />
        </FieldShell>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="company-industry" className="text-sm font-medium text-brand-900">
            Industry
          </label>
          <SuggestInput
            id="company-industry"
            value={industry}
            onValueChange={(value) => {
              setIndustryTouched(true);
              setIndustry(value);
            }}
            onSelect={(item) => {
              setIndustryTouched(true);
              setIndustry(item);
            }}
            items={industrySuggestions}
            itemKey={(item) => item}
            renderItem={(item) => item}
            placeholder="Choose an industry"
            disabled={saving}
            invalid={industryTouched && !industryValid}
            describedBy="company-industry-hint"
          />
          <p
            id="company-industry-hint"
            className={
              industryTouched && !industryValid
                ? 'text-xs text-destructive'
                : 'text-xs text-muted-foreground'
            }
          >
            {industryTouched && !industryValid
              ? 'Please pick your industry from the list.'
              : 'Pick an industry from the list — free text is not accepted.'}
          </p>
        </div>

        <FieldShell id="company-size" label="Company size">
          <Select value={companySize} onValueChange={setCompanySize} disabled={saving}>
            <SelectTrigger id="company-size" className="h-11 w-full">
              <SelectValue placeholder="Select Size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell id="company-address" label="Address">
          <Input
            id="company-address"
            value={address}
            autoComplete="street-address"
            placeholder="Company address"
            disabled={saving}
            onChange={(event) => setAddress(event.target.value)}
            className="h-11"
          />
        </FieldShell>

        {/* ---- contact email: OTP wizard or admin request ------------------ */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="contact-email" className="text-sm font-medium text-brand-900">
              Contact email
            </label>
            <div className="flex items-center gap-2">
              {emailPending ? <StatusPill tone="pending">Request pending</StatusPill> : null}
              {emailEditable ? (
                <StatusPill tone="approved">Approved — you can edit</StatusPill>
              ) : (
                <button
                  type="button"
                  onClick={() => setEmailDialogOpen(true)}
                  className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                >
                  Edit your email
                </button>
              )}
            </div>
          </div>
          <Input
            id="contact-email"
            type="email"
            value={email}
            readOnly={!emailEditable}
            disabled={savingEmail}
            aria-readonly={!emailEditable}
            placeholder="hello@company.com"
            onChange={(event) => setEmail(event.target.value)}
            className={emailEditable ? 'h-11' : 'h-11 bg-muted text-muted-foreground'}
          />
          {emailError ? (
            <p role="alert" className="text-xs text-destructive">
              {emailError}
            </p>
          ) : null}
          {emailEditable ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 self-start"
              disabled={savingEmail}
              onClick={() => void handleSaveEmail()}
            >
              {savingEmail ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Save new email
            </Button>
          ) : null}
        </div>

        {/* ---- phone: admin request only ---------------------------------- */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-brand-900">
              Phone number
            </label>
            <div className="flex items-center gap-2">
              {phonePending ? <StatusPill tone="pending">Request pending</StatusPill> : null}
              {phoneEditable ? (
                <StatusPill tone="approved">Approved — you can edit</StatusPill>
              ) : null}
              {!phoneEditable && !phonePending ? (
                <button
                  type="button"
                  onClick={() => setIdRequest('phone')}
                  className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                >
                  Request to edit
                </button>
              ) : null}
            </div>
          </div>
          <div
            className={
              phoneEditable
                ? 'flex h-11 items-center gap-2 rounded-lg border border-input px-2.5'
                : 'flex h-11 items-center gap-2 rounded-lg border border-input bg-muted px-2.5'
            }
          >
            <span className="text-sm font-medium text-muted-foreground">+234</span>
            <input
              id="phone"
              type="tel"
              value={phone}
              readOnly={!phoneEditable}
              disabled={savingPhone}
              placeholder="812 345 6789"
              onChange={(event) => setPhone(event.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-brand-900 outline-none placeholder:text-muted-foreground"
            />
          </div>
          {phoneError ? (
            <p role="alert" className="text-xs text-destructive">
              {phoneError}
            </p>
          ) : null}
          {phoneEditable ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 self-start"
              disabled={savingPhone}
              onClick={() => void handleSavePhone()}
            >
              {savingPhone ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Save new phone
            </Button>
          ) : null}
        </div>

        <FormAlert>{error}</FormAlert>

        <Button type="submit" className="h-11 w-full bg-brand-700 text-white" disabled={saving}>
          {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
          Save Changes
        </Button>
      </form>

      <EmailChangeDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        currentEmail={email}
        onContactAdmin={() => {
          setEmailDialogOpen(false);
          setIdRequest('email');
        }}
        onChanged={(next) => {
          setEmail(next);
          void refreshUser();
        }}
      />

      <IdRequestDialog
        open={idRequest !== null}
        onOpenChange={(open) => setIdRequest(open ? idRequest : null)}
        kind={idRequest ?? 'email'}
        currentValue={idRequest === 'phone' ? phone : email}
        onSubmitted={() => void refreshUser()}
      />
    </>
  );
}

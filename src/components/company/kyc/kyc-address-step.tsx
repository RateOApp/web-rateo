'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';

import { FormAlert } from '@/components/auth/form-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  LGA_OTHER,
  NIGERIA_KYC_STATES,
  STATE_ABROAD,
  STATE_OTHER,
  lgasForState,
} from '@/lib/constants/nigeria-lgas';
import { usersService } from '@/services/users';

/** What the reviewer will accept, and the Cloudinary ceiling. */
const DOC_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const;
const DOC_MAX_BYTES = 5 * 1024 * 1024;

type DocumentFieldProps = {
  id: string;
  label: string;
  /** Hosted URL once uploaded; `null` while empty. */
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

/**
 * A KYC document: picked, uploaded to `POST /upload` immediately, and kept as
 * a hosted URL.
 *
 * Uploading on pick (rather than on submit) is what lets the submit button gate
 * on a real https URL - the server rejects anything else - and it keeps a slow
 * 5 MB scan out of the critical path of the final request.
 */
export function DocumentField({
  id,
  label,
  value,
  onChange,
  disabled,
}: DocumentFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!(DOC_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError('Please choose a PNG, JPG or PDF file.');
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      setError('Please choose a file smaller than 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const { url } = await usersService.uploadFile(file);
      if (!url) throw new Error('Upload did not return a file URL.');
      setName(file.name);
      onChange(url);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not upload the file.'));
      onChange(null);
    } finally {
      setUploading(false);
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-brand-900">
        {label}
      </Label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2">
        <span className="min-w-0 flex-1 truncate px-1 text-sm text-muted-foreground">
          {value ? (
            <span className="flex items-center gap-1.5 text-brand-900">
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success" />
              {name ?? 'File uploaded'}
            </span>
          ) : (
            'No file selected'
          )}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Upload aria-hidden="true" />
          )}
          {value ? 'Replace' : 'Select file'}
        </Button>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={DOC_MIME_TYPES.join(',')}
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

export type AddressValues = {
  address: string;
  state: string;
  city: string;
  proofOfAddress: string | null;
};

type KycAddressStepProps = {
  values: AddressValues;
  onChange: (patch: Partial<AddressValues>) => void;
  onNext: () => void;
};

/**
 * Where the business actually is, plus a document that proves it.
 *
 * State and LGA are pickers rather than free text so a reviewer can match the
 * proof of address against a real administrative area. The escape hatches
 * matter though: a business registered abroad, or in an LGA the dataset is
 * missing, must still be able to file - so both selects offer a typed
 * alternative rather than dead-ending.
 */
export function KycAddressStep({ values, onChange, onNext }: KycAddressStepProps) {
  const [stateChoice, setStateChoice] = useState(() => {
    if (!values.state) return '';
    return NIGERIA_KYC_STATES.includes(values.state) ? values.state : STATE_OTHER;
  });
  const [lgaChoice, setLgaChoice] = useState(() => {
    if (!values.city) return '';
    return lgasForState(values.state).includes(values.city) ? values.city : LGA_OTHER;
  });
  const [error, setError] = useState<string | null>(null);

  // "Other" and "Abroad" have no LGA list, so the LGA becomes free text.
  const stateIsCustom = stateChoice === STATE_OTHER;
  const lgas = stateChoice === STATE_ABROAD || stateIsCustom ? [] : lgasForState(stateChoice);
  const lgaIsCustom = lgas.length === 0 || lgaChoice === LGA_OTHER;

  function pickState(next: string) {
    setStateChoice(next);
    setLgaChoice('');
    // "Other" clears the field so the user types the state; "Abroad" is itself
    // the answer and is sent as-is.
    onChange({ state: next === STATE_OTHER ? '' : next, city: '' });
  }

  function pickLga(next: string) {
    setLgaChoice(next);
    onChange({ city: next === LGA_OTHER ? '' : next });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !values.address.trim() ||
      !values.state.trim() ||
      !values.city.trim() ||
      !values.proofOfAddress
    ) {
      setError('Please provide all address details');
      return;
    }
    setError(null);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-brand-900">Get verified badge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please provide the following to get verified.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kyc-address" className="text-brand-900">
            Company Address
          </Label>
          <Input
            id="kyc-address"
            value={values.address}
            placeholder="Enter address"
            autoComplete="street-address"
            onChange={(event) => onChange({ address: event.target.value })}
            className="h-11"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kyc-state" className="text-brand-900">
              State
            </Label>
            <Select value={stateChoice} onValueChange={pickState}>
              <SelectTrigger id="kyc-state" className="h-11 w-full">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIA_KYC_STATES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
                <SelectItem value={STATE_OTHER}>{STATE_OTHER}</SelectItem>
                <SelectItem value={STATE_ABROAD}>{STATE_ABROAD}</SelectItem>
              </SelectContent>
            </Select>
            {stateIsCustom ? (
              <Input
                value={values.state}
                aria-label="Type your state"
                placeholder="Type your state"
                onChange={(event) => onChange({ state: event.target.value })}
                className="h-11"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kyc-lga" className="text-brand-900">
              LGA
            </Label>
            {lgas.length ? (
              <Select value={lgaChoice} onValueChange={pickLga} disabled={!stateChoice}>
                <SelectTrigger id="kyc-lga" className="h-11 w-full">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {lgas.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value={LGA_OTHER}>{LGA_OTHER}</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            {lgaIsCustom ? (
              <Input
                id={lgas.length ? undefined : 'kyc-lga'}
                value={values.city}
                aria-label="Type your LGA"
                placeholder="Type your LGA"
                onChange={(event) => onChange({ city: event.target.value })}
                className="h-11"
              />
            ) : null}
          </div>
        </div>

        <DocumentField
          id="kyc-proof-of-address"
          label="Upload proof of address (png, pdf, Jpg. Max 5Mb)"
          value={values.proofOfAddress}
          onChange={(url) => onChange({ proofOfAddress: url })}
        />
      </div>

      <FormAlert>{error}</FormAlert>

      <Button type="submit" className="h-11 w-full bg-brand-700 text-white">
        Next
      </Button>
    </form>
  );
}

'use client';

import { useId, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LGA_OTHER,
  NIGERIA_KYC_STATES,
  STATE_ABROAD,
  STATE_OTHER,
  lgasForState,
} from '@/lib/constants/nigeria-lgas';
import type { LocationDetails } from '@/types/api';

export const NG_COUNTRY = 'NG';

export const EMPTY_LOCATION: LocationDetails = {
  country: NG_COUNTRY,
  state: '',
  city: '',
  street: '',
};

export type LocationErrors = Partial<Record<keyof LocationDetails, string>>;

type LocationPickerProps = {
  value: LocationDetails;
  onChange: (next: LocationDetails) => void;
  /** Companies give a street address; individuals never do. */
  showStreet?: boolean;
  errors?: LocationErrors;
  streetLabel?: string;
};

/**
 * The server canonicalises the capital to "FCT - Abuja" while the LGA dataset
 * keys it "FCT". Map any spelling back to the picker's key.
 */
export function toPickerState(state: string | undefined | null): string {
  const trimmed = (state ?? '').trim();
  if (/^(fct.*|abuja)$/i.test(trimmed)) return 'FCT';
  return trimmed;
}

const WORK_PREFERENCE_SENTINELS = ["i'm open to work anywhere", 'remote'];

/**
 * Legacy individuals stored a work preference ("I'm open to work anywhere",
 * "Remote") in `location`. That is not a place: return '' for it, otherwise
 * the trimmed string.
 */
export function displayLocation(location?: string | null): string {
  const trimmed = (location ?? '').trim();
  const normalised = trimmed.replace(/[‘’]/g, "'").toLowerCase();
  return WORK_PREFERENCE_SENTINELS.includes(normalised) ? '' : trimmed;
}

function isAbroad(value: LocationDetails) {
  return Boolean(value.country) && value.country !== NG_COUNTRY;
}

/**
 * Country/state/city(+street) picker shared by the setup wizards, edit forms
 * and KYC.
 *
 * Nigeria is the default: a state Select, then that state's LGAs. "Abroad"
 * swaps both for free text (country, state/region, city). The placeholders
 * "Abroad" and "Other (type it myself)" are UI-only and never leave this
 * component as values - the typed text is what gets stored.
 */
export function LocationPicker({
  value,
  onChange,
  showStreet = false,
  errors,
  streetLabel = 'Street address',
}: LocationPickerProps) {
  const uid = useId();

  const [stateChoice, setStateChoice] = useState(() => {
    if (isAbroad(value)) return STATE_ABROAD;
    if (!value.state) return '';
    const mapped = toPickerState(value.state);
    return NIGERIA_KYC_STATES.includes(mapped) ? mapped : STATE_OTHER;
  });
  const [lgaChoice, setLgaChoice] = useState(() => {
    if (!value.city) return '';
    return lgasForState(toPickerState(value.state)).includes(value.city) ? value.city : LGA_OTHER;
  });

  const abroad = stateChoice === STATE_ABROAD;
  const stateIsCustom = stateChoice === STATE_OTHER;
  const lgas = abroad || stateIsCustom ? [] : lgasForState(stateChoice);
  const lgaIsCustom = lgas.length > 0 && lgaChoice === LGA_OTHER;
  const cityIsFree = !abroad && lgas.length === 0 && Boolean(stateChoice);

  function patch(next: Partial<LocationDetails>) {
    onChange({ ...value, ...next });
  }

  function pickState(next: string) {
    setStateChoice(next);
    setLgaChoice('');
    if (next === STATE_ABROAD) {
      patch({ country: '', state: '', city: '' });
    } else {
      patch({ country: NG_COUNTRY, state: next === STATE_OTHER ? '' : next, city: '' });
    }
  }

  function pickLga(next: string) {
    setLgaChoice(next);
    patch({ city: next === LGA_OTHER ? '' : next });
  }

  function fieldError(field: keyof LocationDetails) {
    const message = errors?.[field];
    return message ? (
      <p id={`${uid}-${field}-error`} role="alert" className="text-sm text-destructive">
        {message}
      </p>
    ) : null;
  }

  const describe = (field: keyof LocationDetails) =>
    errors?.[field] ? `${uid}-${field}-error` : undefined;

  return (
    <div className="flex flex-col gap-4">
      {showStreet ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-street`} className="text-brand-900">
            {streetLabel}
          </Label>
          <Input
            id={`${uid}-street`}
            value={value.street ?? ''}
            placeholder="Enter address"
            autoComplete="street-address"
            aria-invalid={Boolean(errors?.street) || undefined}
            aria-describedby={describe('street')}
            onChange={(event) => patch({ street: event.target.value })}
            className="h-11"
          />
          {fieldError('street')}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-state`} className="text-brand-900">
            State
          </Label>
          <Select value={stateChoice} onValueChange={pickState}>
            <SelectTrigger
              id={`${uid}-state`}
              className="h-11 w-full"
              aria-invalid={Boolean(errors?.state) || undefined}
              aria-describedby={abroad ? undefined : describe('state')}
            >
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {NIGERIA_KYC_STATES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              {stateIsCustom ? <SelectItem value={STATE_OTHER}>{STATE_OTHER}</SelectItem> : null}
              <SelectItem value={STATE_ABROAD}>{STATE_ABROAD}</SelectItem>
            </SelectContent>
          </Select>
          {stateIsCustom ? (
            <Input
              value={value.state}
              aria-label="Type your state"
              placeholder="Type your state"
              onChange={(event) => patch({ state: event.target.value })}
              className="h-11"
            />
          ) : null}
          {abroad ? null : fieldError('state')}
        </div>

        {abroad ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-country`} className="text-brand-900">
              Country
            </Label>
            <Input
              id={`${uid}-country`}
              value={value.country}
              placeholder="Country"
              autoComplete="country-name"
              aria-invalid={Boolean(errors?.country) || undefined}
              aria-describedby={describe('country')}
              onChange={(event) => patch({ country: event.target.value })}
              className="h-11"
            />
            {fieldError('country')}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-city`} className="text-brand-900">
              City / LGA
            </Label>
            {lgas.length ? (
              <Select value={lgaChoice} onValueChange={pickLga}>
                <SelectTrigger
                  id={`${uid}-city`}
                  className="h-11 w-full"
                  aria-invalid={Boolean(errors?.city) || undefined}
                  aria-describedby={describe('city')}
                >
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {lgas.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value={LGA_OTHER}>Other (type it myself)</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            {lgaIsCustom || cityIsFree ? (
              <Input
                id={lgas.length ? undefined : `${uid}-city`}
                value={value.city}
                aria-label="Type your city or LGA"
                placeholder="Type your city or LGA"
                aria-invalid={Boolean(errors?.city) || undefined}
                aria-describedby={describe('city')}
                onChange={(event) => patch({ city: event.target.value })}
                className="h-11"
              />
            ) : null}
            {!lgas.length && !cityIsFree ? (
              <Select disabled value="">
                <SelectTrigger id={`${uid}-city`} className="h-11 w-full">
                  <SelectValue placeholder="Select state first" />
                </SelectTrigger>
                <SelectContent />
              </Select>
            ) : null}
            {fieldError('city')}
          </div>
        )}
      </div>

      {abroad ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-region`} className="text-brand-900">
              State / Region
            </Label>
            <Input
              id={`${uid}-region`}
              value={value.state}
              placeholder="State / Region"
              aria-invalid={Boolean(errors?.state) || undefined}
              aria-describedby={describe('state')}
              onChange={(event) => patch({ state: event.target.value })}
              className="h-11"
            />
            {fieldError('state')}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-city`} className="text-brand-900">
              City
            </Label>
            <Input
              id={`${uid}-city`}
              value={value.city}
              placeholder="City"
              aria-invalid={Boolean(errors?.city) || undefined}
              aria-describedby={describe('city')}
              onChange={(event) => patch({ city: event.target.value })}
              className="h-11"
            />
            {fieldError('city')}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Validates a picker value; returns per-field messages (empty = valid).
 * Callers must initialise `country` to 'NG'; any other value means Abroad.
 */
export function validateLocation(
  value: LocationDetails,
  opts: { requireStreet?: boolean; requireCity?: boolean } = {},
): LocationErrors {
  const errors: LocationErrors = {};
  const abroad = value.country !== NG_COUNTRY;
  if (abroad && !value.country.trim()) errors.country = 'Please enter your country.';
  if (!value.state.trim()) {
    errors.state = abroad ? 'Please enter your state or region.' : 'Please select your state.';
  }
  if (opts.requireCity && !value.city.trim()) {
    errors.city = abroad ? 'Please enter your city.' : 'Please select your LGA.';
  }
  if (opts.requireStreet && !(value.street ?? '').trim()) {
    errors.street = 'Please enter your street address.';
  }
  return errors;
}

/**
 * Initial picker value for an edit form: structured details first, then the
 * legacy `location` string (a Nigerian state name for individuals, a free-text
 * address for companies, which becomes the street).
 */
export function initialLocation(
  user: { location?: string; locationDetails?: LocationDetails },
  role: 'individual' | 'company',
): LocationDetails {
  const details = user.locationDetails;
  if (details?.state) {
    return {
      country: details.country || NG_COUNTRY,
      state: toPickerState(details.state),
      city: details.city ?? '',
      street: details.street ?? '',
    };
  }
  if (role === 'company') return { ...EMPTY_LOCATION, street: user.location?.trim() ?? '' };
  const legacy = displayLocation(user.location);
  const mapped = toPickerState(legacy);
  if (NIGERIA_KYC_STATES.includes(mapped)) return { ...EMPTY_LOCATION, state: mapped };
  return { ...EMPTY_LOCATION };
}

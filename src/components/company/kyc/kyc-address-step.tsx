'use client';

import { useState } from 'react';

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
import {
  LGA_OTHER,
  NIGERIA_KYC_STATES,
  STATE_ABROAD,
  STATE_OTHER,
  lgasForState,
} from '@/lib/constants/nigeria-lgas';

export type AddressValues = {
  address: string;
  state: string;
  city: string;
};

type KycAddressStepProps = {
  values: AddressValues;
  onChange: (patch: Partial<AddressValues>) => void;
  onNext: () => void;
};

/**
 * Where the business actually is.
 *
 * State and LGA are pickers rather than free text so a reviewer can check the
 * stated location against a real administrative area. The escape hatches
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
    if (!values.address.trim() || !values.state.trim() || !values.city.trim()) {
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
      </div>

      <FormAlert>{error}</FormAlert>

      <Button type="submit" className="h-11 w-full bg-brand-700 text-white">
        Next
      </Button>
    </form>
  );
}

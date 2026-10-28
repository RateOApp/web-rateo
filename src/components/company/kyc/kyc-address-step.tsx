'use client';

import { useState } from 'react';

import { FormAlert } from '@/components/auth/form-alert';
import { LocationPicker } from '@/components/shared/location-picker';
import { Button } from '@/components/ui/button';

export type AddressValues = {
  address: string;
  state: string;
  city: string;
  /** 'NG' (default) or a country name when the business is registered abroad. */
  country?: string;
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
 * stated location against a real administrative area; the shared
 * `LocationPicker` keeps the typed escape hatches (abroad, LGA not listed).
 * The street maps to the KYC `address` field.
 */
export function KycAddressStep({ values, onChange, onNext }: KycAddressStepProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !values.address.trim() ||
      !values.state.trim() ||
      !values.city.trim() ||
      !(values.country ?? 'NG').trim()
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
        <LocationPicker
          showStreet
          streetLabel="Company Address"
          value={{
            country: values.country ?? 'NG',
            state: values.state,
            city: values.city,
            street: values.address,
          }}
          onChange={(next) =>
            onChange({
              country: next.country,
              state: next.state,
              city: next.city,
              address: next.street ?? '',
            })
          }
        />
      </div>

      <FormAlert>{error}</FormAlert>

      <Button type="submit" className="h-11 w-full bg-brand-700 text-white">
        Next
      </Button>
    </form>
  );
}

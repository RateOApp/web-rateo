"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Same eight countries, same order, as the mobile register screen. */
export const COUNTRIES = [
  { code: "NG", flag: "🇳🇬", dial: "+234", name: "Nigeria" },
  { code: "GH", flag: "🇬🇭", dial: "+233", name: "Ghana" },
  { code: "KE", flag: "🇰🇪", dial: "+254", name: "Kenya" },
  { code: "ZA", flag: "🇿🇦", dial: "+27", name: "South Africa" },
  { code: "US", flag: "🇺🇸", dial: "+1", name: "United States" },
  { code: "GB", flag: "🇬🇧", dial: "+44", name: "United Kingdom" },
  { code: "CA", flag: "🇨🇦", dial: "+1", name: "Canada" },
  { code: "IN", flag: "🇮🇳", dial: "+91", name: "India" },
] as const;

type PhoneFieldProps = {
  id: string;
  /** The composed value: `+234801…`, or `''` when no number was typed. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/**
 * Country dial code + national number. Emits the composed `+234…` string, or
 * an empty string when the number is blank - the backend stores `''` for
 * "no phone", and the mobile app sends exactly the same thing.
 */
export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: PhoneFieldProps) {
  const [countryCode, setCountryCode] = useState<string>(
    () =>
      [...COUNTRIES]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find((c) => value.startsWith(c.dial))?.code ?? "NG",
  );

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
  const digits = value.startsWith(country.dial)
    ? value.slice(country.dial.length)
    : value.replace(/\D/g, "");

  function emit(dial: string, national: string) {
    onChange(national ? `${dial}${national}` : "");
  }

  return (
    <div className="flex gap-2">
      <select
        aria-label="Country dial code"
        value={countryCode}
        disabled={disabled}
        onChange={(e) => {
          const next = COUNTRIES.find((c) => c.code === e.target.value) ?? COUNTRIES[0];
          setCountryCode(next.code);
          emit(next.dial, digits);
        }}
        className={cn(
          "h-11 shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="Enter phone number"
        className="h-11"
        value={digits}
        disabled={disabled}
        onBlur={onBlur}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onChange={(e) => emit(country.dial, e.target.value.replace(/\D/g, ""))}
      />
    </div>
  );
}

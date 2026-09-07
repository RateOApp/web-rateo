"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** The backend always emails a 5-digit code. */
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  "aria-describedby"?: string;
};

/**
 * One box per digit, with auto-advance, backspace-to-previous and paste of the
 * whole code. `autoComplete="one-time-code"` on the first box lets iOS and
 * Chrome offer the emailed code.
 */
export function OtpInput({
  value,
  onChange,
  length = 5,
  disabled,
  invalid,
  "aria-describedby": describedBy,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function focus(index: number) {
    refs.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
  }

  function setDigit(index: number, digit: string) {
    const next = Array.from({ length }, (_, i) => (i === index ? digit : (value[i] ?? "")));
    onChange(next.join("").replace(/\s/g, ""));
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigit(index, "");
      return;
    }
    if (cleaned.length > 1) {
      // Typing over a full box, or an autofilled code.
      const chars = cleaned.slice(0, length - index).split("");
      const next = Array.from({ length }, (_, i) =>
        i >= index && i < index + chars.length ? chars[i - index] : (value[i] ?? ""),
      );
      onChange(next.join(""));
      focus(index + chars.length);
      return;
    }
    setDigit(index, cleaned);
    focus(index + 1);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
        return;
      }
      event.preventDefault();
      setDigit(index - 1 < 0 ? 0 : index - 1, "");
      focus(index - 1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  }

  function handlePaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const chars = pasted.slice(0, length - index).split("");
    const next = Array.from({ length }, (_, i) =>
      i >= index && i < index + chars.length ? chars[i - index] : (value[i] ?? ""),
    );
    onChange(next.join(""));
    focus(index + chars.length);
  }

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border border-input bg-transparent text-center text-xl font-semibold text-brand-900 transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            invalid && "border-destructive",
          )}
        />
      ))}
    </div>
  );
}

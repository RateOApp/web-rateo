"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Rendered height in px; the width follows the wordmark's 880x226 ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
};

const RATIO = 880 / 226;

/**
 * The Rate'O wordmark. Falls back to a styled text lockup if the image fails
 * to load (offline, blocked asset), so the header is never empty.
 */
export function Logo({ height = 28, className, priority = false }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "font-bold tracking-tight text-brand-900",
          className,
        )}
        style={{ fontSize: height * 0.85 }}
      >
        Rate<span className="text-accent-600">&rsquo;O</span>
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Rate'O"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
      style={{ height }}
      onError={() => setFailed(true)}
    />
  );
}

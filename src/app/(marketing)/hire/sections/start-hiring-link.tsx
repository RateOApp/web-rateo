"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackMetaCustom } from "@/lib/meta-pixel";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { location: string };

/** Link to /register/company that reports a Meta StartHiringClick event. */
export function StartHiringLink({ location, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      href="/register/company"
      onClick={(e) => {
        trackMetaCustom("StartHiringClick", { location });
        onClick?.(e);
      }}
    />
  );
}

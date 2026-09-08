"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * Splits on http(s) URLs. The trailing `[^\s<]` class stops at whitespace and
 * at `<` so a pasted `<https://…>` cannot swallow markup-looking text.
 */
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

/** Trailing punctuation is far more likely sentence-final than part of the URL. */
function trimTrailingPunctuation(url: string): { href: string; tail: string } {
  const match = /[.,!?;:)\]]+$/.exec(url);
  if (!match) return { href: url, tail: "" };
  return { href: url.slice(0, match.index), tail: match[0] };
}

function safeHref(candidate: string): string | null {
  try {
    const parsed = new URL(candidate);
    // Only these two schemes; `javascript:` and friends never become links.
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/**
 * Message body text: newlines preserved, http(s) URLs turned into links.
 *
 * Built from React elements, never `dangerouslySetInnerHTML` - the content is
 * user input from the other side of the conversation.
 */
export function MessageText({
  text,
  className,
  linkClassName,
}: {
  text: string;
  className?: string;
  linkClassName?: string;
}) {
  const parts = text.split(URL_PATTERN);

  return (
    <p className={cn("text-sm break-words whitespace-pre-wrap", className)}>
      {parts.map((part, index) => {
        // Odd indexes are the captured URLs.
        if (index % 2 === 1) {
          const { href, tail } = trimTrailingPunctuation(part);
          const safe = safeHref(href);
          if (safe) {
            return (
              <Fragment key={index}>
                <a
                  href={safe}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={cn("underline underline-offset-2", linkClassName)}
                >
                  {href}
                </a>
                {tail}
              </Fragment>
            );
          }
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </p>
  );
}

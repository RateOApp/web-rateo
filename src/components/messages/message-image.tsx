"use client";

import Image from "next/image";

/**
 * One image attachment. Hosted attachments are Cloudinary URLs, so `next/image`
 * (unoptimized - the backend already resizes on upload) handles them; a local
 * `blob:` preview on an optimistic bubble is rendered with a plain `<img>`,
 * which is what `next/image` would degrade to anyway for an in-memory object
 * URL that no loader can fetch.
 */
export function MessageImage({ src, alt = "Attachment" }: { src: string; alt?: string }) {
  const local = src.startsWith("blob:") || src.startsWith("data:");

  if (local) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- object URL, no loader can optimise it
      <img
        src={src}
        alt={alt}
        className="h-auto max-h-64 w-full max-w-64 rounded-xl object-cover opacity-70"
      />
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Image
        src={src}
        alt={alt}
        width={320}
        height={320}
        unoptimized
        className="h-auto max-h-64 w-full max-w-64 object-cover"
      />
    </a>
  );
}

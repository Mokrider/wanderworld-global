"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK = "/placeholder-destination.svg";

type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string | null | undefined;
};

/**
 * Wraps next/image so that a dead or unreachable remote photo URL
 * (a deleted Unsplash photo, a typo'd id, a timeout, etc.) degrades to a
 * local, on-brand SVG placeholder instead of a broken/black box —
 * without needing to know in advance which URLs are actually alive.
 */
export function SafeImage({ src, alt, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = !src || failed ? FALLBACK : src;

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

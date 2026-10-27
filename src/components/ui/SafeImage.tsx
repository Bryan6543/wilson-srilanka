"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** next/image with a neutral fallback when the source is missing or fails to load. */
export function SafeImage({ src, alt, className, ...props }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} (image unavailable)` : "Image unavailable"}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-warm text-muted",
          props.fill && "absolute inset-0",
          className,
        )}
      >
        <ImageOff aria-hidden className="size-8" strokeWidth={1.25} />
        <span className="text-xs">Image unavailable</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
      {...props}
    />
  );
}

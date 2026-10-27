"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { ProductImage } from "@/types/product";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const ordered = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = ordered[index];
  const count = ordered.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (zoomOpen && !el.open) el.showModal();
    if (!zoomOpen && el.open) el.close();
  }, [zoomOpen]);

  if (!count) {
    return (
      <div className="relative aspect-[4/5] bg-surface-warm">
        <SafeImage src={null} alt={productName} fill />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row">
      {count > 1 && (
        <ul
          aria-label="Product images"
          className="scrollbar-none flex gap-2 overflow-x-auto md:max-h-[42rem] md:w-20 md:flex-col md:overflow-y-auto"
        >
          {ordered.map((img, i) => (
            <li key={img.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden border bg-surface-warm md:size-20",
                  i === index ? "border-ink" : "border-transparent hover:border-line",
                )}
              >
                <SafeImage src={img.src} alt="" fill sizes="80px" className="object-contain mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-surface-warm"
          aria-label={`Enlarge image: ${current?.alt ?? productName}`}
        >
          <SafeImage
            src={current?.src}
            alt={current?.alt ?? productName}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain mix-blend-multiply"
          />
          <span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/90 opacity-80 transition group-hover:opacity-100">
            <Expand aria-hidden className="size-4" />
          </span>
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 md:hidden"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 md:hidden"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
            <p className="sr-only" aria-live="polite">
              Image {index + 1} of {count}
            </p>
          </>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`${productName} — enlarged images`}
        onClose={() => setZoomOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0"
      >
        <div className="relative h-full w-full">
          <SafeImage src={current?.src} alt={current?.alt ?? productName} fill sizes="100vw" quality={85} className="object-contain" />
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close enlarged view"
            autoFocus
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-surface-alt"
          >
            <X aria-hidden className="size-5" />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-alt"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-alt"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted" aria-live="polite">
                {index + 1} / {count}
              </p>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}

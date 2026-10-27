"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import type { ProductImage } from "@/types/product";
import { TRUSTED_IMAGE_PREFIXES } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** Upload, add-by-URL, reorder, choose primary, edit alt text, remove. */
export function ImageUploader({
  images,
  onChange,
  productName,
  errors,
  canUpload,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  productName: string;
  errors: Record<string, string>;
  canUpload: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlId = useId();
  const [uploading, setUploading] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [url, setUrl] = useState("");

  const ensurePrimary = (list: ProductImage[]) =>
    list.length && !list.some((i) => i.isPrimary) ? list.map((img, i) => ({ ...img, isPrimary: i === 0 })) : list;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setMessages([]);
    const list = [...files].slice(0, 20 - images.length);
    setUploading(list.length);
    const added: ProductImage[] = [];
    const errs: string[] = [];
    // Upload sequentially so large batches don't overwhelm the server.
    for (const file of list) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await res.json()) as { src?: string; width?: number; height?: number; error?: string };
        if (!res.ok || !data.src) throw new Error(data.error ?? "Upload failed");
        added.push({
          src: data.src,
          width: data.width,
          height: data.height,
          alt: productName ? `Wilson ${productName}` : file.name.replace(/\.[^.]+$/, ""),
          isPrimary: false,
        });
      } catch (err) {
        errs.push(`${file.name}: ${(err as Error).message}`);
      }
      setUploading((n) => n - 1);
    }
    onChange(ensurePrimary([...images, ...added]));
    setMessages(errs);
    if (inputRef.current) inputRef.current.value = "";
  }

  function addUrl() {
    const value = url.trim();
    if (!TRUSTED_IMAGE_PREFIXES.some((p) => value.startsWith(p))) {
      setMessages(["Only images from the retailer's or Wilson's official image servers can be linked. Upload other images instead."]);
      return;
    }
    if (images.some((i) => i.src === value)) {
      setMessages(["That image is already added."]);
      return;
    }
    onChange(ensurePrimary([...images, { src: value, alt: productName ? `Wilson ${productName}` : "", isPrimary: false }]));
    setUrl("");
    setMessages([]);
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m!);
    onChange(next);
  };

  return (
    <div>
      {errors.images && <p className="field-error mb-3">{errors.images}</p>}
      {images.length > 0 ? (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.src} className={cn("rounded-md border bg-white p-3", img.isPrimary ? "border-ink" : "border-line")}>
              <div className="relative aspect-square bg-surface-warm">
                <SafeImage src={img.src} alt={img.alt} fill sizes="240px" className="object-contain mix-blend-multiply" />
                {img.isPrimary && (
                  <span className="font-extended absolute left-2 top-2 bg-ink-strong px-2 py-1 text-[10px] text-white">Primary</span>
                )}
              </div>
              <label className="mt-3 block text-xs font-semibold" htmlFor={`alt-${i}`}>
                Alt text (describe the image)
              </label>
              <input
                id={`alt-${i}`}
                value={img.alt}
                onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                aria-invalid={!!errors[`images.${i}.alt`]}
                className="field-input mt-1 min-h-9 py-1.5 text-sm"
              />
              {(errors[`images.${i}.alt`] || errors[`images.${i}.src`]) && (
                <p className="field-error">{errors[`images.${i}.alt`] ?? errors[`images.${i}.src`]}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="primary-image"
                    checked={img.isPrimary}
                    onChange={() => onChange(images.map((x, j) => ({ ...x, isPrimary: j === i })))}
                    className="accent-ink"
                  />
                  Primary image
                </label>
                <div className="flex">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="p-1.5 disabled:opacity-30" aria-label={`Move image ${i + 1} earlier`}>
                    <ArrowUp aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === images.length - 1}
                    className="p-1.5 disabled:opacity-30"
                    aria-label={`Move image ${i + 1} later`}
                  >
                    <ArrowDown aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(ensurePrimary(images.filter((_, j) => j !== i)))}
                    className="p-1.5 text-error"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">No images yet.</p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={(e) => upload(e.target.files)}
            className="sr-only"
            id="image-file"
            disabled={!canUpload || uploading > 0 || images.length >= 20}
          />
          <label
            htmlFor="image-file"
            className={cn("btn btn-secondary btn-sm", (!canUpload || uploading > 0) && "pointer-events-none opacity-50")}
          >
            {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
            {uploading ? `Uploading ${uploading}…` : "Upload images"}
          </label>
        </div>
        <div className="flex min-w-64 flex-1 items-end gap-2">
          <div className="flex-1">
            <label htmlFor={urlId} className="field-label text-xs">
              …or add an image URL
            </label>
            <input
              id={urlId}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="https://cdn.shopify.com/…"
              className="field-input min-h-9 py-1.5 text-sm"
            />
          </div>
          <button type="button" onClick={addUrl} disabled={!url.trim()} className="btn btn-secondary btn-sm">
            <Link2 aria-hidden className="size-4" /> Add
          </button>
        </div>
      </div>
      <p className="field-hint">
        JPEG, PNG, WebP, AVIF or GIF up to 8 MB, at least 200 × 200 px. Uploads are resized and converted to WebP, and
        location and camera metadata are removed.
        {!canUpload && " Uploading needs persistent storage to be configured."}
      </p>
      <div aria-live="polite">
        {messages.map((m) => (
          <p key={m} className="field-error">
            {m}
          </p>
        ))}
      </div>
    </div>
  );
}

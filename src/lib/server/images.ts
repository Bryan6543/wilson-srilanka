import "server-only";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { getStore } from "./database";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "heif"]);
const MAX_DIMENSION = 2000;

export class ImageValidationError extends Error {}

/**
 * Validates and re-encodes an uploaded image. The real format is detected from the file
 * contents (not the browser-supplied MIME type), the image is auto-rotated, resized to at
 * most 2000px and re-encoded to WebP. Re-encoding drops all metadata (EXIF, GPS, ICC…) and
 * any non-image payload, so uploaded files can never be served as executable content.
 */
export async function processImage(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  if (input.length === 0) throw new ImageValidationError("The file is empty.");
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageValidationError("Images must be 8 MB or smaller.");

  let meta: SharpMetadata;
  try {
    meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new ImageValidationError("This file is not a supported image.");
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new ImageValidationError("Use a JPEG, PNG, WebP, AVIF or GIF image.");
  }
  if ((meta.width ?? 0) < 200 || (meta.height ?? 0) < 200) {
    throw new ImageValidationError("Images must be at least 200 × 200 pixels.");
  }

  const { data, info } = await sharp(input, { limitInputPixels: 50_000_000, animated: false })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

export async function storeUploadedImage(file: File): Promise<{ src: string; width: number; height: number }> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageValidationError("Images must be 8 MB or smaller.");
  const processed = await processImage(Buffer.from(await file.arrayBuffer()));
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "image";
  const src = await getStore().saveImage(processed.data, `${base}.webp`, "image/webp");
  return { src, width: processed.width, height: processed.height };
}

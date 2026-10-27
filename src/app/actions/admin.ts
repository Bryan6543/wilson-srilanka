"use server";

import { redirect } from "next/navigation";
import type { Product } from "@/types/product";
import { assertAdmin, UnauthorizedError } from "@/lib/server/auth";
import { getStore } from "@/lib/server/database";
import {
  deleteProduct,
  duplicateProduct,
  importProductsCsv,
  saveProduct,
  setProductFlags,
  syncFromRetailer,
  type ActionResult,
  type ImportReport,
  type SyncReport,
} from "@/lib/server/products";
import { revalidateCatalog, revalidateContent } from "@/lib/server/revalidate";
import { StoreNotWritableError } from "@/lib/server/store/types";
import { env } from "@/lib/server/env";
import { categoryInputSchema, fieldErrors, isTrustedImageSrc, siteContentSchema } from "@/lib/validation";

const IMAGE_SOURCE_ERROR = "Use an uploaded image, a /images/… path, or the retailer's / Wilson's image servers";

/** Common guard: authenticated admin + writable storage. Returns an error result or null. */
async function guard(): Promise<{ ok: false; error: string } | null> {
  try {
    await assertAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, error: err.message };
    throw err;
  }
  if (!getStore().writable) return { ok: false, error: new StoreNotWritableError().message };
  return null;
}

export async function saveProductAction(id: string | null, payload: unknown): Promise<ActionResult<Product>> {
  const blocked = await guard();
  if (blocked) return blocked;
  const result = await saveProduct(id, payload);
  if (result.ok) revalidateCatalog();
  return result;
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const result = await deleteProduct(id);
  if (result.ok) revalidateCatalog();
  return result;
}

export async function duplicateProductAction(id: string): Promise<ActionResult<Product>> {
  const blocked = await guard();
  if (blocked) return blocked;
  const result = await duplicateProduct(id);
  if (result.ok) {
    revalidateCatalog();
    redirect(`/admin/products/${result.data!.id}?duplicated=1`);
  }
  return result;
}

export async function setProductFlagsAction(
  id: string,
  flags: { published?: boolean; featured?: boolean },
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const clean: { published?: boolean; featured?: boolean } = {};
  if (typeof flags.published === "boolean") clean.published = flags.published;
  if (typeof flags.featured === "boolean") clean.featured = flags.featured;
  const result = await setProductFlags(id, clean);
  if (result.ok) revalidateCatalog();
  return result;
}

export async function importCsvAction(text: string): Promise<ActionResult<ImportReport>> {
  const blocked = await guard();
  if (blocked) return blocked;
  if (typeof text !== "string" || text.length > 5_000_000) return { ok: false, error: "The CSV file is too large (5 MB max)." };
  const result = await importProductsCsv(text);
  if (result.ok && (result.data?.created || result.data?.updated)) revalidateCatalog();
  return result;
}

export async function syncRetailerAction(): Promise<ActionResult<SyncReport>> {
  const blocked = await guard();
  if (blocked) return blocked;
  const result = await syncFromRetailer();
  if (result.ok) revalidateCatalog();
  return result;
}

export async function saveCategoryAction(payload: unknown): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const parsed = categoryInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.image && !isTrustedImageSrc(parsed.data.image, env.supabaseUrl)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { image: IMAGE_SOURCE_ERROR } };
  }
  try {
    await getStore().upsertCategory(parsed.data);
    revalidateCatalog();
    return { ok: true, message: "Category saved." };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteCategoryAction(slug: string): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const store = getStore();
  const inUse = (await store.listProducts()).filter((p) => p.category === slug).length;
  if (inUse) return { ok: false, error: `This category still has ${inUse} product(s). Move or delete them first.` };
  try {
    await store.deleteCategory(slug);
    revalidateCatalog();
    return { ok: true, message: "Category deleted." };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function saveSiteContentAction(payload: unknown): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const parsed = siteContentSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const badImages: Record<string, string> = {};
  if (!isTrustedImageSrc(parsed.data.hero.image, env.supabaseUrl)) badImages["hero.image"] = IMAGE_SOURCE_ERROR;
  if (!isTrustedImageSrc(parsed.data.spotlight.image, env.supabaseUrl)) badImages["spotlight.image"] = IMAGE_SOURCE_ERROR;
  if (!isTrustedImageSrc(parsed.data.saleBanner.image, env.supabaseUrl)) badImages["saleBanner.image"] = IMAGE_SOURCE_ERROR;
  if (Object.keys(badImages).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: badImages };
  try {
    await getStore().saveSiteContent(parsed.data);
    revalidateContent();
    return { ok: true, message: "Site content saved." };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

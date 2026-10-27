import "server-only";
import { randomUUID } from "node:crypto";
import type { Product } from "@/types/product";
import { csvRecordToProductInput, csvToRecords } from "@/lib/csv";
import {
  applyRetailerOffers,
  fetchRetailerOffers,
  mapFeed,
  mergeRetailerFields,
  type ShopifyFeedProduct,
} from "@/lib/retailer-import";
import { slugify, uniqueSlug } from "@/lib/utils";
import { fieldErrors, isTrustedImageSrc, productInputSchema, type ProductInput } from "@/lib/validation";
import { getStore } from "./database";
import { env } from "./env";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export class ProductValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Validates raw input and turns it into a complete Product, enforcing catalogue-level rules. */
export async function buildProduct(raw: unknown, existing: Product | null, all: Product[]): Promise<Product> {
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ProductValidationError("Please fix the highlighted fields.", fieldErrors(parsed.error));
  }
  const input: ProductInput = parsed.data;
  const fields: Record<string, string> = {};

  const categories = await getStore().listCategories();
  if (!categories.some((c) => c.slug === input.category)) fields.category = "Choose an existing category";

  input.images.forEach((img, i) => {
    if (!isTrustedImageSrc(img.src, env.supabaseUrl)) {
      fields[`images.${i}.src`] = "Image must be uploaded here or come from a trusted Wilson / retailer address";
    }
  });

  const others = all.filter((p) => p.id !== existing?.id);
  const slug = input.slug || slugify(input.name);
  if (!slug) fields.slug = "Enter a URL slug";
  else if (others.some((p) => p.slug === slug)) fields.slug = `The URL "/products/${slug}" is already used by another product`;
  if (input.externalId && others.some((p) => p.externalId === input.externalId)) {
    fields.externalId = "Another product already has this source ID";
  }
  if (Object.keys(fields).length) throw new ProductValidationError("Please fix the highlighted fields.", fields);

  const now = new Date().toISOString();
  const { id: _ignored, discountSource: _clientSource, ...rest } = input;
  void [_ignored, _clientSource];
  // Who owns the offer: unchanged retailer offers stay "retailer" (kept in sync); anything an
  // administrator sets or changes becomes "manual" so retailer sync never overwrites it.
  const discountSource: Product["discountSource"] =
    input.discountPercent === undefined
      ? undefined
      : existing?.discountSource && existing.discountPercent === input.discountPercent
        ? existing.discountSource
        : "manual";
  return {
    ...rest,
    id: existing?.id ?? randomUUID(),
    slug,
    discountSource,
    discountLabel: input.discountPercent === undefined ? undefined : input.discountLabel,
    brand: "Wilson",
    currency: input.currency ?? (input.price !== undefined ? "LKR" : undefined),
    // Retailer variant mapping is only kept while the variant options still match.
    skus: input.skus.filter((s) =>
      Object.entries(s.options).every(([name, value]) => input.variants.some((v) => v.name === name && v.value === value)),
    ),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function toResult(err: unknown): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  if (err instanceof ProductValidationError) return { ok: false, error: err.message, fieldErrors: err.fields };
  console.error("[products]", err);
  return { ok: false, error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
}

export async function saveProduct(id: string | null, raw: unknown): Promise<ActionResult<Product>> {
  try {
    const store = getStore();
    const all = await store.listProducts();
    const existing = id ? (all.find((p) => p.id === id) ?? null) : null;
    if (id && !existing) return { ok: false, error: "This product no longer exists." };
    const product = await buildProduct(raw, existing, all);
    const saved = await store.upsertProduct(product);
    return { ok: true, data: saved, message: existing ? "Product updated." : "Product created." };
  } catch (err) {
    return toResult(err);
  }
}

export async function duplicateProduct(id: string): Promise<ActionResult<Product>> {
  try {
    const store = getStore();
    const all = await store.listProducts();
    const source = all.find((p) => p.id === id);
    if (!source) return { ok: false, error: "This product no longer exists." };
    const now = new Date().toISOString();
    const copy: Product = {
      ...structuredClone(source),
      id: randomUUID(),
      name: `${source.name} (copy)`,
      slug: uniqueSlug(`${source.slug}-copy`, new Set(all.map((p) => p.slug))),
      externalId: undefined,
      skus: [],
      discountSource: source.discountPercent ? "manual" : undefined,
      published: false,
      featured: false,
      createdAt: now,
      updatedAt: now,
    };
    await store.upsertProduct(copy);
    return { ok: true, data: copy, message: "Draft copy created." };
  } catch (err) {
    return toResult(err);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await getStore().deleteProduct(id);
    return { ok: true, message: "Product deleted." };
  } catch (err) {
    return toResult(err);
  }
}

export async function setProductFlags(
  id: string,
  flags: Partial<Pick<Product, "published" | "featured">>,
): Promise<ActionResult> {
  try {
    const store = getStore();
    const product = await store.getProduct(id);
    if (!product) return { ok: false, error: "This product no longer exists." };
    if (flags.published && !product.images.length) {
      return { ok: false, error: "Add at least one image before publishing." };
    }
    await store.upsertProduct({ ...product, ...flags, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export interface ImportReport {
  created: number;
  updated: number;
  errors: { row: number; name: string; message: string }[];
}

/**
 * CSV import. Rows are matched to existing products by id, then source ID, then slug, then
 * retailer URL. Every row is validated; invalid rows are reported and nothing is half-saved.
 */
export async function importProductsCsv(text: string): Promise<ActionResult<ImportReport>> {
  try {
    const store = getStore();
    const records = csvToRecords(text);
    if (records.length > 2000) return { ok: false, error: "Import up to 2,000 rows at a time." };
    const all = await store.listProducts();
    const working = [...all];
    const toSave: Product[] = [];
    const report: ImportReport = { created: 0, updated: 0, errors: [] };

    for (const [i, rec] of records.entries()) {
      const input = csvRecordToProductInput(rec);
      const match =
        (input.id && working.find((p) => p.id === input.id)) ||
        (input.externalId && working.find((p) => p.externalId === input.externalId)) ||
        (input.slug && working.find((p) => p.slug === input.slug)) ||
        (input.retailerUrl && working.find((p) => p.retailerUrl === input.retailerUrl)) ||
        null;
      try {
        // Retailer SKU mapping is not part of the CSV; keep the existing one.
        const product = await buildProduct({ ...input, skus: match?.skus ?? [] }, match, working);
        if (match) {
          working[working.indexOf(match)] = product;
          report.updated++;
        } else {
          working.push(product);
          report.created++;
        }
        toSave.push(product);
      } catch (err) {
        const msg =
          err instanceof ProductValidationError
            ? Object.entries(err.fields)
                .map(([f, m]) => `${f}: ${m}`)
                .join("; ") || err.message
            : (err as Error).message;
        report.errors.push({ row: i + 2, name: input.name || "(no name)", message: msg });
      }
    }
    if (report.errors.length) {
      return {
        ok: true,
        data: { ...report, created: 0, updated: 0 },
        message: `No changes saved: ${report.errors.length} row(s) need fixing. Correct them and import again.`,
      };
    }
    await store.upsertProducts(toSave);
    return { ok: true, data: report, message: `Imported ${report.created} new and updated ${report.updated} product(s).` };
  } catch (err) {
    return toResult(err);
  }
}

export interface SyncReport {
  offers: number;
  refreshed: number;
  addedAsDrafts: number;
  notInFeed: number;
}

/**
 * Pulls the configured retailer's public product feed and refreshes price, stock, variant
 * links and retailer URLs for products imported from it. New Wilson listings are added as
 * drafts for review. Admin-edited content (names, descriptions, images…) is never overwritten.
 */
export async function syncFromRetailer(): Promise<ActionResult<SyncReport>> {
  try {
    const store = getStore();
    const feed: ShopifyFeedProduct[] = [];
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(`${env.retailerUrl}/products.json?limit=250&page=${page}`, {
        headers: { "User-Agent": "WilsonSriLankaCatalogSync/1.0" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
        redirect: "error",
      });
      if (!res.ok) return { ok: false, error: `The retailer feed responded with HTTP ${res.status}.` };
      const { products } = (await res.json()) as { products: ShopifyFeedProduct[] };
      if (!Array.isArray(products) || !products.length) break;
      feed.push(...products);
    }
    const all = await store.listProducts();
    const idPrefix = new URL(env.retailerUrl).hostname.replace(/^www\./, "").split(".")[0] ?? "retailer";
    const mapped = mapFeed(feed, { baseUrl: env.retailerUrl, name: env.retailerName, idPrefix, currency: "LKR" }, all.map((p) => p.slug));
    const { offers } = await fetchRetailerOffers(env.retailerUrl, env.retailerOffersPage);
    const incoming = applyRetailerOffers(
      mapped.imported.map((m) => m.product),
      offers,
      env.retailerOfferLabel,
    );
    const byExternal = new Map(all.filter((p) => p.externalId).map((p) => [p.externalId!, p]));
    const toSave: Product[] = [];
    const report: SyncReport = {
      offers: incoming.filter((p) => p.discountPercent).length,
      refreshed: 0,
      addedAsDrafts: 0,
      notInFeed: 0,
    };
    const seen = new Set<string>();
    for (const product of incoming) {
      seen.add(product.externalId!);
      const existing = byExternal.get(product.externalId!);
      if (existing) {
        toSave.push(mergeRetailerFields(existing, product));
        report.refreshed++;
      } else {
        toSave.push({ ...product, published: false, featured: false });
        report.addedAsDrafts++;
      }
    }
    report.notInFeed = all.filter((p) => p.externalId?.startsWith(`${idPrefix}:`) && !seen.has(p.externalId)).length;
    await store.upsertProducts(toSave);
    return {
      ok: true,
      data: report,
      message: `Refreshed ${report.refreshed} product(s), including ${report.offers} retailer offer(s); ${report.addedAsDrafts} new listing(s) added as drafts.`,
    };
  } catch (err) {
    return toResult(err);
  }
}

/** Data-quality overview for the dashboard. */
export function catalogueHealth(products: Product[]) {
  const missingImages = products.filter((p) => !p.images.length);
  const missingSource = products.filter((p) => !p.sourceUrl);
  const incomplete = products.filter(
    (p) => !p.description || p.price === undefined || !p.specifications.length || !p.retailerUrl,
  );
  return {
    total: products.length,
    published: products.filter((p) => p.published).length,
    drafts: products.filter((p) => !p.published).length,
    featured: products.filter((p) => p.featured).length,
    outOfStock: products.filter((p) => p.availability === "out_of_stock").length,
    onOffer: products.filter((p) => p.published && p.discountPercent).length,
    missingImages,
    missingSource,
    incomplete,
    needsReview: products.filter((p) => p.adminNotes?.includes("[blocking]") && !p.published),
  };
}

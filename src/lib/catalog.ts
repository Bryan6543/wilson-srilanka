import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getStore } from "./server/database";
import { savingPercent } from "./pricing";
import type { Category, Product, SiteContent } from "@/types/product";

// Public, cached reads. Admin mutations call `revalidateCatalog()` (lib/server/revalidate.ts)
// so changes appear on the public site immediately.
export const CATALOG_TAG = "catalog";
export const CONTENT_TAG = "site-content";

const loadAllProducts = unstable_cache(async () => getStore().listProducts(), ["all-products"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

const loadCategories = unstable_cache(async () => getStore().listCategories(), ["categories"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

const loadSiteContent = unstable_cache(async () => getStore().getSiteContent(), ["site-content"], {
  tags: [CONTENT_TAG],
  revalidate: 300,
});

/** Published products only — drafts never reach public pages. */
export const getPublishedProducts = cache(async (): Promise<Product[]> =>
  (await loadAllProducts()).filter((p) => p.published),
);

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const products = await getPublishedProducts();
  return products.find((p) => p.slug === slug) ?? null;
});

export const getCategories = cache(async (): Promise<Category[]> =>
  (await loadCategories()).filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder),
);

export const getCategory = cache(async (slug: string): Promise<Category | null> => {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
});

export const getSiteContent = cache(async (): Promise<SiteContent> => loadSiteContent());

/** Categories that actually have published products, with counts. */
export const getCategoriesWithCounts = cache(async () => {
  const [categories, products] = await Promise.all([getCategories(), getPublishedProducts()]);
  return categories
    .map((c) => ({ ...c, count: products.filter((p) => p.category === c.slug).length }))
    .filter((c) => c.count > 0);
});

export interface OfferSummary {
  count: number;
  maxPercent: number;
  /** Distinct discount levels, highest first, with product counts. */
  tiers: { percent: number; count: number }[];
  /** Most common offer name, e.g. "Anniversary Offer". */
  label?: string;
}

/** Live summary of current offers, computed from published products (never hard-coded). */
export const getOfferSummary = cache(async (): Promise<OfferSummary | null> => {
  const products = (await getPublishedProducts()).filter((p) => savingPercent(p) !== undefined);
  if (!products.length) return null;
  const tiers = new Map<number, number>();
  const labels = new Map<string, number>();
  for (const p of products) {
    const pct = savingPercent(p)!;
    tiers.set(pct, (tiers.get(pct) ?? 0) + 1);
    if (p.discountLabel) labels.set(p.discountLabel, (labels.get(p.discountLabel) ?? 0) + 1);
  }
  return {
    count: products.length,
    maxPercent: Math.max(...tiers.keys()),
    tiers: [...tiers.entries()].sort((a, b) => b[0] - a[0]).map(([percent, count]) => ({ percent, count })),
    label: [...labels.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
  };
});

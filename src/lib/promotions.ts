// Chooses which products the homepage sale banners promote. Pure — unit-tested.
import type { Product } from "../types/product.ts";
import { savingPercent } from "./pricing.ts";

export const RACKET_FAMILIES = [
  { tag: "pro-staff", name: "Pro Staff" },
  { tag: "blade", name: "Blade" },
  { tag: "clash", name: "Clash" },
  { tag: "ultra", name: "Ultra" },
  { tag: "rf", name: "RF" },
] as const;

export type RacketFamilyTag = (typeof RACKET_FAMILIES)[number]["tag"];

export interface HeroCollection {
  family: (typeof RACKET_FAMILIES)[number];
  /** The rackets shown on the banner, best deal first. */
  products: Product[];
  /** How many discounted, in-stock rackets the family has in total. */
  total: number;
  maxPercent: number;
}

const isEligibleRacket = (p: Product) =>
  p.published &&
  p.category === "tennis-rackets" &&
  p.availability === "in_stock" &&
  p.images.length > 0 &&
  !!p.retailerUrl &&
  savingPercent(p) !== undefined;

const byBestDeal = (a: Product, b: Product) =>
  savingPercent(b)! - savingPercent(a)! ||
  Number(b.featured) - Number(a.featured) ||
  (b.price ?? 0) - (a.price ?? 0) ||
  b.images.length - a.images.length ||
  a.name.localeCompare(b.name);

/**
 * One banner per racket family showing several of its discounted, in-stock rackets at the
 * retailer. Families need at least `minPerFamily` rackets; they are ordered by best discount,
 * then by size of the deal range, and only the top `limit` are returned.
 */
export function pickHeroCollections(
  products: Product[],
  { perFamily = 4, minPerFamily = 2, limit = 4 }: { perFamily?: number; minPerFamily?: number; limit?: number } = {},
): HeroCollection[] {
  const eligible = products.filter(isEligibleRacket);
  const collections: HeroCollection[] = [];
  for (const family of RACKET_FAMILIES) {
    const items = eligible.filter((p) => p.tags.includes(family.tag) && !p.tags.includes("junior")).sort(byBestDeal);
    if (items.length < minPerFamily) continue;
    collections.push({
      family,
      products: items.slice(0, perFamily),
      total: items.length,
      maxPercent: savingPercent(items[0]!)!,
    });
  }
  return collections
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.maxPercent - a.c.maxPercent || b.c.total - a.c.total || a.i - b.i)
    .slice(0, limit)
    .map(({ c }) => c);
}

// Single source of truth for what a product actually costs. Pure — used on server, client,
// scripts and tests. Relative imports only.
import type { Product } from "../types/product.ts";

type Priced = Pick<Product, "price" | "compareAtPrice" | "discountPercent">;

export function hasOffer(p: Pick<Product, "price" | "discountPercent">): boolean {
  return p.price !== undefined && !!p.discountPercent && p.discountPercent > 0 && p.discountPercent < 100;
}

/** Applies a percentage offer, rounded to cents (matches the retailer's own calculation). */
export function applyDiscount(amount: number, percent: number | undefined): number {
  if (!percent || percent <= 0 || percent >= 100) return amount;
  return Math.round(amount * (100 - percent)) / 100;
}

/** The price a customer pays (offer price when an offer is active). */
export function sellingPrice(p: Priced): number | undefined {
  if (p.price === undefined) return undefined;
  return hasOffer(p) ? applyDiscount(p.price, p.discountPercent) : p.price;
}

/** The "was" price to strike through, if any. */
export function originalPrice(p: Priced): number | undefined {
  if (p.price === undefined) return undefined;
  if (hasOffer(p)) return p.price;
  return p.compareAtPrice !== undefined && p.compareAtPrice > p.price ? p.compareAtPrice : undefined;
}

/** Whole-number percentage saved, from either an offer or a compare-at price. */
export function savingPercent(p: Priced): number | undefined {
  if (hasOffer(p)) return p.discountPercent;
  const was = originalPrice(p);
  const now = sellingPrice(p);
  if (was === undefined || now === undefined || was <= now) return undefined;
  return Math.round(((was - now) / was) * 100);
}

export function isOnSale(p: Priced): boolean {
  return savingPercent(p) !== undefined;
}

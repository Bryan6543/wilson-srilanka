// Pure search / filter / sort / paginate over the catalogue. Shared by the catalogue,
// category and search pages, and unit-tested in tests/product-query.test.ts.
import type { Product } from "../types/product.ts";
import { savingPercent, sellingPrice } from "./pricing.ts";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Featured" },
  { value: "newest", label: "Recently added" },
  { value: "discount", label: "Biggest discount" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A–Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface ProductQuery {
  q?: string;
  category?: string[];
  sport?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onOffer?: boolean;
  /** Exact discount level, e.g. 25 for the 25%-off tier. */
  offerPercent?: number;
  sort?: SortValue;
  page?: number;
  pageSize?: number;
}

export interface ProductQueryResult {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 24;

type Params = Record<string, string | string[] | undefined>;

function list(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  const arr = (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Parses URL search params into a safe, normalised query. Unknown values are ignored. */
export function parseProductQuery(params: Params): ProductQuery {
  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as SortValue) : undefined;
  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const page = num(params.page);
  return {
    q: qRaw?.trim().slice(0, 100) || undefined,
    category: list(params.category),
    sport: list(params.sport),
    tags: list(params.tag),
    minPrice: num(params.min),
    maxPrice: num(params.max),
    inStock: (Array.isArray(params.stock) ? params.stock[0] : params.stock) === "in",
    onOffer: (Array.isArray(params.offer) ? params.offer[0] : params.offer) === "1",
    offerPercent: (() => {
      const n = num(params.pct);
      return n !== undefined && Number.isInteger(n) && n > 0 && n < 100 ? n : undefined;
    })(),
    sort,
    page: page && page >= 1 ? Math.floor(page) : 1,
  };
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Weighted text score; 0 means "no match". Every search term must match somewhere. */
export function scoreProduct(p: Product, q: string): number {
  const terms = normalise(q).split(" ").filter(Boolean);
  if (!terms.length) return 1;
  const name = normalise(p.name);
  const meta = normalise([p.model, p.productCode, p.category, p.sport, ...p.tags].filter(Boolean).join(" "));
  const body = normalise([p.description, ...p.features, ...p.specifications.map((s) => s.value)].join(" "));
  let score = 0;
  for (const t of terms) {
    if (name.split(" ").includes(t)) score += 10;
    else if (name.includes(t)) score += 6;
    else if (meta.includes(t)) score += 4;
    else if (body.includes(t)) score += 1;
    else return 0;
  }
  if (name.includes(normalise(q))) score += 5;
  return score;
}

/** Filters and sorts use what the customer actually pays (offer price when discounted). */
function effectivePrice(p: Product): number | undefined {
  return sellingPrice(p);
}

export function queryProducts(all: Product[], query: ProductQuery): ProductQueryResult {
  let items = all.filter((p) => p.published);
  const scores = new Map<string, number>();

  if (query.q) {
    items = items.filter((p) => {
      const s = scoreProduct(p, query.q!);
      if (s > 0) scores.set(p.id, s);
      return s > 0;
    });
  }
  if (query.category?.length) items = items.filter((p) => query.category!.includes(p.category));
  if (query.sport?.length) items = items.filter((p) => !!p.sport && query.sport!.includes(p.sport));
  if (query.tags?.length) items = items.filter((p) => query.tags!.some((t) => p.tags.includes(t)));
  if (query.minPrice !== undefined) items = items.filter((p) => (effectivePrice(p) ?? -1) >= query.minPrice!);
  if (query.maxPrice !== undefined)
    items = items.filter((p) => {
      const price = effectivePrice(p);
      return price !== undefined && price <= query.maxPrice!;
    });
  if (query.inStock) items = items.filter((p) => p.availability === "in_stock");
  if (query.onOffer) items = items.filter((p) => savingPercent(p) !== undefined);
  if (query.offerPercent !== undefined) items = items.filter((p) => savingPercent(p) === query.offerPercent);

  const sort = query.sort ?? "relevance";
  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name);
  // Products without a price always sort last when sorting by price.
  const priceCmp = (dir: 1 | -1) => (a: Product, b: Product) => {
    const pa = effectivePrice(a);
    const pb = effectivePrice(b);
    if (pa === undefined && pb === undefined) return byName(a, b);
    if (pa === undefined) return 1;
    if (pb === undefined) return -1;
    return (pa - pb) * dir || byName(a, b);
  };
  const sorters: Record<SortValue, (a: Product, b: Product) => number> = {
    relevance: (a, b) =>
      (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
      Number(b.featured) - Number(a.featured) ||
      Number(b.availability === "in_stock") - Number(a.availability === "in_stock") ||
      byName(a, b),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b),
    discount: (a, b) => (savingPercent(b) ?? 0) - (savingPercent(a) ?? 0) || priceCmp(1)(a, b),
    "price-asc": priceCmp(1),
    "price-desc": priceCmp(-1),
    "name-asc": byName,
  };
  items = [...items].sort(sorters[sort]);

  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageCount, pageSize };
}

/** Related products: same category first, then shared tags/sport, excluding the product itself. */
export function relatedProducts(all: Product[], product: Product, limit = 4): Product[] {
  return all
    .filter((p) => p.published && p.id !== product.id)
    .map((p) => ({
      p,
      score:
        (p.category === product.category ? 5 : 0) +
        p.tags.filter((t) => product.tags.includes(t)).length * 3 +
        (p.sport && p.sport === product.sport ? 1 : 0) +
        (p.availability === "in_stock" ? 0.5 : 0),
    }))
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

export function priceBounds(products: Product[]): { min: number; max: number } | null {
  const prices = products.map(effectivePrice).filter((n): n is number => n !== undefined);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function primaryImage(p: Pick<Product, "images">) {
  return p.images.find((i) => i.isPrimary) ?? p.images[0];
}

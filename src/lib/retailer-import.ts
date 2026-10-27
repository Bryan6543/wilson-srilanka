// Maps a Shopify storefront feed (`/products.json`) — e.g. the United Sports listing —
// into catalogue products. Pure module: used by scripts/import-retailer.ts and the admin
// "sync from retailer" action. Relative imports only so Node can run it directly.
import type { Availability, LabelValue, Product, ProductSku, ProductVariant } from "../types/product.ts";
import { decodeEntities, fixSentenceSpacing, htmlToText, slugify, uniqueSlug } from "./utils.ts";

export interface ShopifyFeedProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  options: { name: string; values: string[] }[];
  variants: {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    price: string;
    compare_at_price: string | null;
    available: boolean;
  }[];
  images: { src: string; width?: number; height?: number; alt?: string | null; position?: number }[];
}

export interface ImportIssue {
  level: "blocking" | "warning";
  message: string;
}

export interface ImportedProduct {
  product: Product;
  issues: ImportIssue[];
}

export interface ImportResult {
  imported: ImportedProduct[];
  skipped: { title: string; handle: string; reason: string }[];
}

export interface RetailerConfig {
  baseUrl: string; // e.g. https://www.unitedsports.lk
  name: string; // e.g. United Sports
  idPrefix: string; // e.g. unitedsports
  currency: string; // e.g. LKR
}

// ---------------------------------------------------------------------------
// Description parsing
// ---------------------------------------------------------------------------

export interface ParsedDescription {
  description: string;
  features: string[];
  specifications: LabelValue[];
  profile: LabelValue[];
  idealFor: string[];
  inTheBox: string[];
  model?: string;
  productCode?: string;
  sourceCategory?: string;
}

const DROP_SPEC_LABELS = /^(condition|brand|category)$/i;
const MODEL_LABEL = /^model$/i;
const CODE_LABEL = /^(product|model)\s*code$/i;
const RATING_VALUE = /^(very\s+)?(low|medium|high)$|^(consistent|excellent|good|moderate|fast|slow)$/i;

function listItems(html: string): string[] {
  return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => htmlToText(m[1] ?? ""))
    .filter((t) => t.length > 0 && !/^<ul/i.test(t));
}

function tableRows(html: string): LabelValue[] {
  const rows: LabelValue[] = [];
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(row[1] ?? "").matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
      htmlToText(c[1] ?? "").replace(/:$/, "").trim(),
    );
    if (cells.length >= 2 && cells[0] && cells[1]) rows.push({ label: cells[0], value: cells[1] });
  }
  return rows;
}

function sectionHeading(html: string): string | undefined {
  const m = html.match(/^\s*(?:<p[^>]*>\s*)?<(strong|b|h\d)[^>]*>([\s\S]*?)<\/\1>/i);
  return m ? htmlToText(m[2] ?? "").replace(/:$/, "") : undefined;
}

export function parseDescriptionHtml(html: string): ParsedDescription {
  const out: ParsedDescription = {
    description: "",
    features: [],
    specifications: [],
    profile: [],
    idealFor: [],
    inTheBox: [],
  };
  const sections = html.split(/<hr\s*\/?>/i);

  // Section 0: the marketing description, possibly with an inline feature list.
  const intro = sections[0] ?? "";
  const introList = listItems(intro);
  let introText = htmlToText(intro.replace(/<ul[\s\S]*?<\/ul>/gi, " "));
  const codeMatch = introText.match(/(?:Product|Model)\s*Code:?\s*([A-Z0-9][A-Z0-9\-/]+)/i);
  if (codeMatch) out.productCode = codeMatch[1];
  introText = introText.replace(/(?:Product|Model)\s*Code:?\s*[A-Z0-9][A-Z0-9\-/]+/gi, " ");
  // Inline "Key Features: a b c" (no list markup) belongs to features, not the description.
  introText = introText.split(/\bKey Features:?/i)[0] ?? introText;
  out.description = fixSentenceSpacing(introText);
  if (introList.length) out.features.push(...introList);

  for (const raw of sections.slice(1)) {
    const heading = sectionHeading(raw) ?? "";
    const rows = tableRows(raw);
    const items = listItems(raw);

    if (rows.length) {
      const isProfile = /perk|rating|performance/i.test(heading) || rows.every((r) => RATING_VALUE.test(r.value));
      if (isProfile) {
        out.profile.push(...rows);
      } else {
        for (const r of rows) {
          if (/^category$/i.test(r.label)) out.sourceCategory = r.value;
          if (MODEL_LABEL.test(r.label)) {
            out.model = r.value;
            continue;
          }
          if (CODE_LABEL.test(r.label)) {
            out.productCode ??= r.value;
            continue;
          }
          if (DROP_SPEC_LABELS.test(r.label)) continue;
          out.specifications.push(r);
        }
      }
      continue;
    }

    const headingText = heading.toLowerCase();
    const bodyText = htmlToText(raw.replace(/^\s*(?:<p[^>]*>\s*)?<(strong|b|h\d)[^>]*>[\s\S]*?<\/\1>/i, ""));
    const values = items.length ? items : bodyText ? [bodyText] : [];
    if (/ideal/.test(headingText)) out.idealFor.push(...values);
    else if (/includ|in the box/.test(headingText)) out.inTheBox.push(...values);
    else if (items.length) out.features.push(...items);
  }

  out.features = [...new Set(out.features.map(decodeEntities))];
  return out;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export function classify(title: string): { category: string; sport: string } {
  const t = title.toLowerCase();
  if (/basketball/.test(t)) return { category: "basketball", sport: "basketball" };
  if (/grip|dampener|string|overgrip/.test(t)) return { category: "tennis-accessories", sport: "tennis" };
  if (/\bbag\b|backpack/.test(t)) return { category: "tennis-bags", sport: "tennis" };
  if (/\bballs?\b/.test(t)) return { category: "tennis-balls", sport: "tennis" };
  if (/shoe/.test(t)) return { category: "tennis-shoes", sport: "tennis" };
  if (/racket|racquet/.test(t)) return { category: "tennis-rackets", sport: "tennis" };
  return { category: "tennis-accessories", sport: "tennis" };
}

const SERIES = [
  "Blade",
  "Clash",
  "Pro Staff",
  "Ultra",
  "RF",
  "US Open",
  "Roland Garros",
  "Rush Pro",
  "Kaos",
  "Super Tour",
] as const;

export function deriveTags(title: string, sourceTags: string[]): string[] {
  const tags = new Set<string>();
  for (const s of SERIES) if (new RegExp(`\\b${s}\\b`, "i").test(title)) tags.add(s.toLowerCase().replace(/\s+/g, "-"));
  if (sourceTags.some((t) => /junior/i.test(t)) || /\b(junior|jr|kids)\b/i.test(title)) tags.add("junior");
  return [...tags];
}

const KEEP_UPPER = new Set(["RF", "US", "UL", "JR", "PK", "FIBA", "WT4", "3X3", "II", "UTTG"]);

/** "WILSON SUPER TOUR (V14.0) PRO STAFF BAG (9PK)" → "Super Tour (V14.0) Pro Staff Bag (9PK)". */
export function cleanProductName(title: string): string {
  let name = decodeEntities(title).replace(/^\s*wilson\s+/i, "").trim();
  const letters = name.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "");
  if (letters.length > 0 && upper.length / letters.length > 0.7) {
    name = name.replace(/[A-Za-z][A-Za-z']*/g, (w) =>
      KEEP_UPPER.has(w.toUpperCase()) || /\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase(),
    );
  }
  return name.replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function isWilsonListing(p: Pick<ShopifyFeedProduct, "vendor" | "title">): boolean {
  return /wilson/i.test(p.vendor) || /^\s*wilson\b/i.test(p.title);
}

export function mapFeedProduct(
  p: ShopifyFeedProduct,
  cfg: RetailerConfig,
  takenSlugs: Set<string>,
  nowIso = new Date().toISOString(),
): ImportedProduct {
  const issues: ImportIssue[] = [];
  const name = cleanProductName(p.title);
  const parsed = parseDescriptionHtml(p.body_html ?? "");
  const { category, sport } = classify(p.title);

  // Variants & SKUs — ignore Shopify's placeholder "Default Title" and single-value options.
  const options = p.options
    .map((o, idx) => ({ name: o.name.trim(), idx, values: o.values.map((v) => v.trim()) }))
    .filter((o) => o.values.length > 1);
  const variants: ProductVariant[] = [];
  for (const o of options) {
    for (const value of o.values) {
      const available = p.variants.some(
        (v) => v.available && (v[`option${o.idx + 1}` as "option1"] ?? "").trim() === value,
      );
      variants.push({ name: o.name, value, available });
    }
  }
  const skus: ProductSku[] = options.length
    ? p.variants.map((v) => ({
        options: Object.fromEntries(
          options.map((o) => [o.name, (v[`option${o.idx + 1}` as "option1"] ?? "").trim()]),
        ),
        retailerVariantId: String(v.id),
        price: Number(v.price),
        available: v.available,
      }))
    : [];

  // Price: the lowest variant price. A compare-at price is only a sale when it is higher.
  const priced = p.variants
    .map((v) => ({ price: Number(v.price), compare: v.compare_at_price ? Number(v.compare_at_price) : undefined }))
    .filter((v) => Number.isFinite(v.price) && v.price > 0)
    .sort((a, b) => a.price - b.price);
  const cheapest = priced[0];
  let compareAtPrice: number | undefined;
  if (cheapest?.compare !== undefined) {
    if (cheapest.compare > cheapest.price) compareAtPrice = cheapest.compare;
    else
      issues.push({
        level: "warning",
        message: `Retailer compare-at price (${cheapest.compare}) is lower than the selling price (${cheapest.price}); sale price not shown.`,
      });
  }
  if (!cheapest) issues.push({ level: "blocking", message: "No valid price in the retailer listing." });

  const availability: Availability = p.variants.some((v) => v.available) ? "in_stock" : "out_of_stock";

  const images = [...p.images]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((img, i) => ({
      src: img.src,
      alt: img.alt?.trim() || `Wilson ${name}${p.images.length > 1 ? ` — view ${i + 1}` : ""}`,
      isPrimary: i === 0,
      width: img.width,
      height: img.height,
    }));
  if (!images.length) issues.push({ level: "blocking", message: "Listing has no product images." });
  if (!parsed.description) issues.push({ level: "blocking", message: "Listing has no description." });

  // The source listing's own category must agree with the product title.
  if (parsed.sourceCategory) {
    const src = parsed.sourceCategory.toLowerCase();
    const expected: Record<string, RegExp> = {
      "tennis-rackets": /racket|racquet/,
      "tennis-balls": /ball/,
      "tennis-bags": /bag|backpack|accessor/,
      "tennis-shoes": /shoe/,
      "tennis-accessories": /accessor|grip|string|dampener/,
      basketball: /basketball/,
    };
    const re = expected[category];
    if (re && !re.test(src) && !(category === "tennis-rackets" && /junior/.test(src))) {
      issues.push({
        level: "blocking",
        message: `Listing description is for "${parsed.sourceCategory}" but the title says "${name}" — verify content before publishing.`,
      });
    }
  }
  if (!/wilson/i.test(p.vendor)) {
    issues.push({ level: "warning", message: `Retailer vendor field is "${p.vendor}" (brand taken from title).` });
  }

  const slug = uniqueSlug(slugify(name), takenSlugs);
  takenSlugs.add(slug);
  const retailerUrl = `${cfg.baseUrl.replace(/\/$/, "")}/products/${p.handle}`;
  const blocking = issues.some((i) => i.level === "blocking");

  const product: Product = {
    id: `${cfg.idPrefix}-${p.id}`,
    slug,
    name,
    brand: "Wilson",
    model: parsed.model,
    productCode: parsed.productCode,
    category,
    sport,
    description: parsed.description,
    features: parsed.features,
    specifications: parsed.specifications,
    profile: parsed.profile,
    idealFor: parsed.idealFor,
    inTheBox: parsed.inTheBox,
    images,
    variants,
    skus,
    price: cheapest?.price,
    compareAtPrice,
    currency: cfg.currency,
    availability,
    retailerUrl,
    sourceUrl: retailerUrl,
    sourceName: cfg.name,
    externalId: `${cfg.idPrefix}:${p.id}`,
    featured: false,
    published: !blocking,
    tags: deriveTags(p.title, p.tags),
    adminNotes: issues.length ? issues.map((i) => `[${i.level}] ${i.message}`).join("\n") : undefined,
    createdAt: p.created_at ? new Date(p.created_at).toISOString() : nowIso,
    updatedAt: nowIso,
  };
  return { product, issues };
}

export function mapFeed(
  feed: ShopifyFeedProduct[],
  cfg: RetailerConfig,
  existingSlugs: Iterable<string> = [],
): ImportResult {
  const taken = new Set(existingSlugs);
  const result: ImportResult = { imported: [], skipped: [] };
  const seenExternal = new Set<number>();
  const seenNames = new Map<string, string>();

  for (const p of feed) {
    if (!isWilsonListing(p)) continue; // other brands are simply out of scope
    if (classify(p.title).sport === "basketball") continue; // basketball is not sold on this site
    if (seenExternal.has(p.id)) {
      result.skipped.push({ title: p.title, handle: p.handle, reason: "Duplicate retailer product id in feed." });
      continue;
    }
    seenExternal.add(p.id);
    const mapped = mapFeedProduct(p, cfg, taken);
    const key = mapped.product.name.toLowerCase();
    const prior = seenNames.get(key);
    if (prior) {
      mapped.issues.push({
        level: "warning",
        message: `Same title as "${prior}" (different retailer listing) — consider renaming to tell them apart.`,
      });
      mapped.product.adminNotes = mapped.issues.map((i) => `[${i.level}] ${i.message}`).join("\n");
    } else {
      seenNames.set(key, mapped.product.slug);
    }
    result.imported.push(mapped);
  }
  return result;
}

/**
 * Refreshes retailer-owned fields (price, stock, links, SKUs) on an existing product
 * while keeping everything an administrator may have edited.
 */
export function mergeRetailerFields(existing: Product, incoming: Product): Product {
  return {
    ...existing,
    price: incoming.price,
    compareAtPrice: incoming.compareAtPrice,
    currency: incoming.currency,
    availability: incoming.availability,
    retailerUrl: incoming.retailerUrl,
    skus: incoming.skus,
    variants: incoming.variants.length ? incoming.variants : existing.variants,
    // Retailer offers follow the retailer; manual offers set in admin are kept.
    ...(existing.discountSource === "manual"
      ? {}
      : {
          discountPercent: incoming.discountPercent,
          discountLabel: incoming.discountLabel,
          discountSource: incoming.discountSource,
        }),
    updatedAt: incoming.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Retailer offers (percentage discounts)
// ---------------------------------------------------------------------------

export interface RetailerOffer {
  percent: number;
  /** Where the figure came from, for the admin notes / import report. */
  evidence: string;
  conflict?: string;
}

/**
 * Parses the retailer's offers page (e.g. /pages/anniversary-offers). Each product card carries
 * a "NN% OFF" badge — this is the figure customers actually see, so it wins over collections.
 */
export function parseOffersPage(html: string): Map<string, number> {
  const out = new Map<string, number>();
  const re = /&quot;handle&quot;:&quot;([a-z0-9-]+)&quot;[\s\S]*?featured-discount-badge"[^>]*>\s*(\d{1,2})\s*%\s*OFF/gi;
  for (const m of html.matchAll(re)) {
    const pct = Number(m[2]);
    if (!out.has(m[1]!) && pct > 0 && pct < 100) out.set(m[1]!, pct);
  }
  return out;
}

/** "Aniversary Discount 15%" / "25% Offers" → 15 / 25. Collections without a % are ignored. */
export function percentFromTitle(title: string): number | undefined {
  const m = title.match(/(\d{1,2})\s*%/);
  const n = m ? Number(m[1]) : NaN;
  return n > 0 && n < 100 ? n : undefined;
}

/**
 * Combines offers-page badges with discount-collection membership. The page badge wins; when a
 * product sits in several collections with different percentages and is not on the page, the
 * lower percentage is used (never over-promise) and the conflict is recorded.
 */
export function resolveOffers(
  pageOffers: Map<string, number>,
  collectionOffers: { handle: string; percent: number; collection: string }[],
): Map<string, RetailerOffer> {
  const out = new Map<string, RetailerOffer>();
  const byHandle = new Map<string, { percent: number; collection: string }[]>();
  for (const c of collectionOffers) {
    if (!byHandle.has(c.handle)) byHandle.set(c.handle, []);
    byHandle.get(c.handle)!.push(c);
  }
  for (const [handle, percent] of pageOffers) out.set(handle, { percent, evidence: "offers page badge" });
  for (const [handle, list] of byHandle) {
    const distinct = [...new Set(list.map((l) => l.percent))].sort((a, b) => a - b);
    const conflict = distinct.length > 1 ? `listed in ${list.map((l) => `${l.collection} (${l.percent}%)`).join(", ")}` : undefined;
    const existing = out.get(handle);
    if (existing) {
      if (conflict) existing.conflict = conflict;
      continue;
    }
    out.set(handle, { percent: distinct[0]!, evidence: `collection ${list[0]!.collection}`, conflict });
  }
  return out;
}

const handleOf = (p: Product) => p.retailerUrl?.split("/products/")[1]?.split(/[?#]/)[0];

/**
 * Sets retailer offers on products imported from that retailer. Offers an administrator set
 * by hand (`discountSource: "manual"`) are left untouched; stale retailer offers are removed.
 */
export function applyRetailerOffers(products: Product[], offers: Map<string, RetailerOffer>, label: string): Product[] {
  return products.map((p) => {
    if (p.discountSource === "manual") return p;
    const handle = handleOf(p);
    const offer = handle ? offers.get(handle) : undefined;
    if (!offer) {
      if (p.discountSource !== "retailer") return p;
      const { discountPercent: _a, discountLabel: _b, discountSource: _c, ...rest } = p;
      void [_a, _b, _c];
      return rest as Product;
    }
    return { ...p, discountPercent: offer.percent, discountLabel: label, discountSource: "retailer" };
  });
}

/** Fetches the retailer's discount collections and offers page (polite: one request at a time). */
export async function fetchRetailerOffers(
  baseUrl: string,
  offersPagePath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ offers: Map<string, RetailerOffer>; collections: string[] }> {
  const base = baseUrl.replace(/\/$/, "");
  const get = async (path: string) => {
    const res = await fetchImpl(`${base}${path}`, {
      headers: { "User-Agent": "WilsonSriLankaCatalogSync/1.0" },
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    if (!res.ok) throw new Error(`Retailer responded ${res.status} for ${path}`);
    return res;
  };
  const { collections } = (await (await get("/collections.json?limit=250")).json()) as {
    collections: { handle: string; title: string }[];
  };
  const discountCollections = collections
    .map((c) => ({ ...c, percent: percentFromTitle(c.title) }))
    .filter((c) => c.percent !== undefined && /offer|discount|sale|off/i.test(`${c.handle} ${c.title}`));
  const memberships: { handle: string; percent: number; collection: string }[] = [];
  for (const c of discountCollections) {
    const { products } = (await (await get(`/collections/${c.handle}/products.json?limit=250`)).json()) as {
      products: { handle: string }[];
    };
    for (const p of products) memberships.push({ handle: p.handle, percent: c.percent!, collection: c.handle });
  }
  let page = new Map<string, number>();
  try {
    page = parseOffersPage(await (await get(offersPagePath)).text());
  } catch {
    // The offers page is optional; collections alone still give the percentages.
  }
  return { offers: resolveOffers(page, memberships), collections: discountCollections.map((c) => c.handle) };
}

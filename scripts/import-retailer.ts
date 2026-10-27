// Builds the bundled seed catalogue (src/data/products.seed.json) from the verified local
// retailer's public Shopify feed, and writes a human-readable import report.
//
//   npm run import:retailer                      # fetch live from LOCAL_RETAILER_URL
//   npm run import:retailer -- --from ./feed     # use saved products.json pages
//
// The feed is fetched politely (one page at a time, with a pause between requests).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  applyRetailerOffers,
  fetchRetailerOffers,
  mapFeed,
  type RetailerOffer,
  type ShopifyFeedProduct,
} from "../src/lib/retailer-import.ts";

const root = resolve(import.meta.dirname, "..");
const baseUrl = (process.env.LOCAL_RETAILER_URL || "https://www.unitedsports.lk").replace(/\/$/, "");
const retailerName = process.env.LOCAL_RETAILER_NAME || "United Sports";
const fromIdx = process.argv.indexOf("--from");
const fromDir = fromIdx > -1 ? process.argv[fromIdx + 1] : undefined;
const skipOffers = process.argv.includes("--no-offers");
const offersPage = process.env.RETAILER_OFFERS_PAGE || "/pages/anniversary-offers";
const offerLabel = process.env.RETAILER_OFFER_LABEL || "Anniversary Offer";

// Flagship products highlighted on the homepage (retailer handles). Editable later in admin.
const FEATURED_HANDLES = new Set([
  "wilson-blade-98-16x19-tennis-racket-v9",
  "wilson-pro-staff-97ul-tennis-racket-v14",
  "wilson-ultra-100ul-v5-tennis-racket",
  "wilson-clash-100-ul-v3-tennis-racket",
  "wilson-rf-01-future-tennis-racket",
  "wilson-rush-pro-ace-tennis-shoes-1",
  "wilson-us-open-green-tournament-tennis-balls-can",
  "wilson-pro-staff-super-tour-tennis-bag-v14-0-15pk",
]);

async function loadFeed(): Promise<ShopifyFeedProduct[]> {
  if (fromDir) {
    const dir = resolve(fromDir);
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => (JSON.parse(readFileSync(join(dir, f), "utf8")) as { products: ShopifyFeedProduct[] }).products);
  }
  const all: ShopifyFeedProduct[] = [];
  for (let page = 1; page <= 20; page++) {
    const url = `${baseUrl}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, { headers: { "User-Agent": "WilsonSriLankaCatalogImporter/1.0" } });
    if (!res.ok) throw new Error(`Feed request failed: ${res.status} ${url}`);
    const { products } = (await res.json()) as { products: ShopifyFeedProduct[] };
    if (!products.length) break;
    all.push(...products);
    console.log(`Fetched page ${page}: ${products.length} listings`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  return all;
}

const feed = await loadFeed();
const handleById = new Map(feed.map((p) => [p.id, p.handle]));
const result = mapFeed(feed, { baseUrl, name: retailerName, idPrefix: "unitedsports", currency: "LKR" });

let offers = new Map<string, RetailerOffer>();
if (!skipOffers) {
  const fetched = await fetchRetailerOffers(baseUrl, offersPage);
  offers = fetched.offers;
  console.log(`Offers: ${offers.size} discounted listings across ${fetched.collections.join(", ")}`);
}
const products = applyRetailerOffers(
  result.imported.map(({ product }) => {
    const handle = handleById.get(Number(product.externalId?.split(":")[1]));
    return { ...product, featured: product.published && !!handle && FEATURED_HANDLES.has(handle) };
  }),
  offers,
  offerLabel,
);
products.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

writeFileSync(join(root, "src/data/products.seed.json"), JSON.stringify(products, null, 2) + "\n");

const lines = [
  "# Retailer import report",
  "",
  `Source: ${baseUrl}/products.json (${retailerName}) — generated ${new Date().toISOString()}`,
  "",
  `- Listings in feed: ${feed.length}`,
  `- Wilson listings imported: ${products.length}`,
  `- Published: ${products.filter((p) => p.published).length}`,
  `- Saved as draft (needs review): ${products.filter((p) => !p.published).length}`,
  `- Skipped: ${result.skipped.length}`,
  "",
  `- With a retailer offer: ${products.filter((p) => p.discountPercent).length} (${offerLabel}, from ${offersPage} and the retailer’s discount collections)`,
  "",
  "## Offers",
  "",
  ...products
    .filter((p) => p.discountPercent)
    .sort((a, b) => b.discountPercent! - a.discountPercent! || a.name.localeCompare(b.name))
    .map((p) => {
      const o = offers.get(p.retailerUrl!.split("/products/")[1]!);
      return `- ${p.discountPercent}% — ${p.name} (${o?.evidence ?? "retailer"}${o?.conflict ? `; note: ${o.conflict}` : ""})`;
    }),
  "",
  "## Drafts and warnings",
  "",
  ...result.imported
    .filter((r) => r.issues.length)
    .flatMap((r) => [
      `### ${r.product.name} (${r.product.published ? "published" : "draft"})`,
      `Retailer listing: ${r.product.retailerUrl}`,
      ...r.issues.map((i) => `- **${i.level}**: ${i.message}`),
      "",
    ]),
  "## Skipped",
  "",
  ...(result.skipped.length ? result.skipped.map((s) => `- ${s.title} (${s.handle}): ${s.reason}`) : ["None."]),
  "",
];
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs/import-report.md"), lines.join("\n"));
console.log(lines.slice(4, 10).join("\n"));
console.log("Wrote src/data/products.seed.json and docs/import-report.md");

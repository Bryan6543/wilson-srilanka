// Loads the bundled seed catalogue (categories, products, site content) into Supabase.
// Safe to re-run: rows are upserted, so existing products with the same id are overwritten
// with the seed version. Use --only-new to insert only products that don't exist yet.
//
//   node --env-file=.env.local scripts/seed-supabase.ts [--only-new]
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SEED_CATEGORIES } from "../src/data/categories.ts";
import { DEFAULT_SITE_CONTENT } from "../src/data/site-content.ts";
import type { Product } from "../src/types/product.ts";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. node --env-file=.env.local scripts/seed-supabase.ts).");
  process.exit(1);
}
const onlyNew = process.argv.includes("--only-new");
const db = createClient(url, key, { auth: { persistSession: false } });
const products = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../src/data/products.seed.json"), "utf8"),
) as Product[];

const check = (label: string, error: { message: string } | null) => {
  if (error) {
    console.error(`${label} failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
};

check(
  `categories (${SEED_CATEGORIES.length})`,
  (
    await db.from("categories").upsert(
      SEED_CATEGORIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        sport: c.sport ?? null,
        description: c.description,
        image: c.image ?? null,
        sort_order: c.sortOrder,
        visible: c.visible,
      })),
    )
  ).error,
);

let rows = products;
if (onlyNew) {
  const { data, error } = await db.from("products").select("id");
  check("read existing products", error);
  const existing = new Set((data ?? []).map((r: { id: string }) => r.id));
  rows = products.filter((p) => !existing.has(p.id));
}
check(
  `products (${rows.length})`,
  (
    await db.from("products").upsert(
      rows.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        published: p.published,
        featured: p.featured,
        external_id: p.externalId ?? null,
        data: p,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
    )
  ).error,
);

const { data: content } = await db.from("site_content").select("key").eq("key", "site").maybeSingle();
if (!content) {
  check("site content", (await db.from("site_content").insert({ key: "site", value: DEFAULT_SITE_CONTENT })).error);
} else {
  console.log("• site content already exists — left unchanged");
}
console.log("Done.");

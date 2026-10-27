import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProductQuery, queryProducts, relatedProducts, scoreProduct } from "../src/lib/product-query.ts";
import type { Product } from "../src/types/product.ts";

const base: Product = {
  id: "x",
  slug: "x",
  name: "X",
  brand: "Wilson",
  category: "tennis-rackets",
  sport: "tennis",
  description: "",
  features: [],
  specifications: [],
  profile: [],
  idealFor: [],
  inTheBox: [],
  images: [],
  variants: [],
  skus: [],
  featured: false,
  published: true,
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const p = (o: Partial<Product>): Product => ({ ...base, ...o });

const catalogue = [
  p({ id: "1", slug: "blade-98", name: "Blade 98 Tennis Racket", price: 75000, tags: ["blade"], availability: "in_stock", featured: true }),
  p({ id: "2", slug: "clash-100", name: "Clash 100 Tennis Racket", price: 69000, tags: ["clash"], availability: "out_of_stock" }),
  p({ id: "3", slug: "us-open-ball", name: "US Open Tennis Ball", category: "tennis-balls", price: 2100, availability: "in_stock", createdAt: "2026-06-01T00:00:00.000Z" }),
  p({ id: "4", slug: "draft", name: "Draft Racket", published: false, price: 1 }),
  p({ id: "5", slug: "no-price", name: "Mystery Bag", category: "tennis-bags" }),
];

test("drafts are never returned", () => {
  const r = queryProducts(catalogue, {});
  assert.equal(r.total, 4);
  assert.ok(!r.items.some((x) => x.id === "4"));
});

test("search matches all terms and ranks name matches first", () => {
  assert.deepEqual(queryProducts(catalogue, { q: "racket" }).items.map((x) => x.id).sort(), ["1", "2"]);
  assert.deepEqual(queryProducts(catalogue, { q: "blade racket" }).items.map((x) => x.id), ["1"]);
  assert.equal(queryProducts(catalogue, { q: "padel" }).total, 0);
  assert.ok(scoreProduct(catalogue[0]!, "blade") > scoreProduct(catalogue[0]!, "racket") - 100);
});

test("category, tag, stock and price filters combine", () => {
  assert.equal(queryProducts(catalogue, { category: ["tennis-balls"] }).total, 1);
  assert.equal(queryProducts(catalogue, { tags: ["clash"] }).total, 1);
  assert.equal(queryProducts(catalogue, { inStock: true }).total, 2);
  assert.deepEqual(queryProducts(catalogue, { minPrice: 3000, maxPrice: 70000 }).items.map((x) => x.id), ["2"]);
});

test("price sort keeps unpriced products last in both directions", () => {
  assert.deepEqual(queryProducts(catalogue, { sort: "price-asc" }).items.map((x) => x.id), ["3", "2", "1", "5"]);
  assert.deepEqual(queryProducts(catalogue, { sort: "price-desc" }).items.map((x) => x.id), ["1", "2", "3", "5"]);
  assert.equal(queryProducts(catalogue, { sort: "newest" }).items[0]!.id, "3");
});

test("pagination clamps out-of-range pages", () => {
  const r = queryProducts(catalogue, { pageSize: 2, page: 99 });
  assert.equal(r.pageCount, 2);
  assert.equal(r.page, 2);
  assert.equal(r.items.length, 2);
});

test("URL params are parsed safely", () => {
  const q = parseProductQuery({ q: "  blade ", category: "a,b", sort: "evil", min: "-5", max: "abc", page: "0", stock: "in" });
  assert.equal(q.q, "blade");
  assert.deepEqual(q.category, ["a", "b"]);
  assert.equal(q.sort, undefined);
  assert.equal(q.minPrice, undefined);
  assert.equal(q.maxPrice, undefined);
  assert.equal(q.page, 1);
  assert.equal(q.inStock, true);
});

test("related products prefer the same category and exclude drafts and self", () => {
  const rel = relatedProducts(catalogue, catalogue[0]!);
  assert.equal(rel[0]!.id, "2");
  assert.ok(!rel.some((x) => x.id === "1" || x.id === "4"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { pickHeroCollections } from "../src/lib/promotions.ts";
import { savingPercent } from "../src/lib/pricing.ts";
import seed from "../src/data/products.seed.json" with { type: "json" };
import type { Product } from "../src/types/product.ts";

const products = seed as unknown as Product[];

test("hero collections: several in-stock, discounted retailer rackets per family", () => {
  const collections = pickHeroCollections(products);
  assert.equal(collections.length, 4);
  assert.equal(new Set(collections.map((c) => c.family.tag)).size, 4, "one banner per family");
  for (const c of collections) {
    assert.ok(c.products.length >= 2 && c.products.length <= 4, `${c.family.name} shows 2–4 rackets`);
    assert.ok(c.total >= c.products.length);
    assert.equal(c.maxPercent, savingPercent(c.products[0]!));
    for (const p of c.products) {
      assert.equal(p.category, "tennis-rackets");
      assert.equal(p.availability, "in_stock");
      assert.ok(p.published && p.retailerUrl?.startsWith("https://www.unitedsports.lk/products/"));
      assert.ok(p.tags.includes(c.family.tag) && !p.tags.includes("junior"));
      assert.ok(savingPercent(p) !== undefined);
    }
    const pcts = c.products.map((p) => savingPercent(p)!);
    assert.deepEqual(pcts, [...pcts].sort((a, b) => b - a), "best deals first");
  }
});

test("hero collections skip families without enough sale rackets", () => {
  const oneEach = pickHeroCollections(products, { minPerFamily: 99 });
  assert.equal(oneEach.length, 0);
  const noStock = products.map((p) => (p.category === "tennis-rackets" ? { ...p, availability: "out_of_stock" as const } : p));
  assert.equal(pickHeroCollections(noStock).length, 0);
  const noOffers = products.map((p) => ({ ...p, discountPercent: undefined, compareAtPrice: undefined }));
  assert.equal(pickHeroCollections(noOffers).length, 0);
});

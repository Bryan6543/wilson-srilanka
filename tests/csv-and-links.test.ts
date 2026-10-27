import { test } from "node:test";
import assert from "node:assert/strict";
import { csvRecordToProductInput, csvToRecords, parseCsv, productsToCsv } from "../src/lib/csv.ts";
import { buildPurchaseUrl } from "../src/lib/retailer-link.ts";
import { isTrustedImageSrc, productInputSchema } from "../src/lib/validation.ts";
import seed from "../src/data/products.seed.json" with { type: "json" };
import type { Product } from "../src/types/product.ts";

test("CSV parser handles quotes, commas, newlines and BOM", () => {
  const rows = parseCsv('﻿a,b\r\n"x, y","say ""hi""\nthere"\r\n');
  assert.deepEqual(rows, [
    ["a", "b"],
    ["x, y", 'say "hi"\nthere'],
  ]);
});

test("export → import round-trip preserves product data", () => {
  const products = (seed as unknown as Product[]).slice(0, 5);
  const records = csvToRecords(productsToCsv(products));
  assert.equal(records.length, 5);
  for (const [i, rec] of records.entries()) {
    const input = csvRecordToProductInput(rec);
    const original = products[i]!;
    assert.equal(input.name, original.name);
    assert.equal(input.price, original.price);
    assert.deepEqual(input.features, original.features);
    assert.deepEqual(input.specifications, original.specifications);
    assert.equal(input.images.length, original.images.length);
    assert.equal(input.published, original.published);
    const parsed = productInputSchema.safeParse({ ...input, skus: [] });
    assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  }
});

test("CSV export neutralises spreadsheet formulas", () => {
  const p = { ...(seed as unknown as Product[])[0]!, name: "=HYPERLINK(\"http://evil\")" };
  assert.ok(productsToCsv([p]).includes("'=HYPERLINK"));
  const back = csvRecordToProductInput(csvToRecords(productsToCsv([p]))[0]!);
  assert.equal(back.name, p.name);
});

test("CSV import requires core columns", () => {
  assert.throws(() => csvToRecords("name,price\nX,1"), /category/);
});

test("purchase links: variant deep-link, UTM, and unsafe URLs rejected", () => {
  const url = buildPurchaseUrl("https://www.unitedsports.lk/products/x", { variantId: "123", utmSource: "wilson-lk" });
  assert.equal(
    url,
    "https://www.unitedsports.lk/products/x?variant=123&utm_source=wilson-lk&utm_medium=referral&utm_campaign=wilson_catalogue",
  );
  assert.equal(buildPurchaseUrl("javascript:alert(1)"), null);
  assert.equal(buildPurchaseUrl(undefined), null);
  assert.ok(!buildPurchaseUrl("https://shop.lk/p", { variantId: "1;drop" })!.includes("variant"));
});

test("only trusted image sources are accepted", () => {
  assert.ok(isTrustedImageSrc("https://cdn.shopify.com/s/files/1/0732/7583/4503/files/a.png?v=1"));
  assert.ok(isTrustedImageSrc("/images/campaign/racket-wall.webp"));
  assert.ok(!isTrustedImageSrc("https://cdn.shopify.com/s/files/1/9999/other-store/a.png"));
  assert.ok(!isTrustedImageSrc("http://cdn.shopify.com/s/files/1/0732/7583/4503/a.png"));
  assert.ok(!isTrustedImageSrc("/images/../../etc/passwd"));
  assert.ok(isTrustedImageSrc("https://abc.supabase.co/storage/v1/object/public/product-images/x.webp", "https://abc.supabase.co"));
});

test("validation rejects a sale price that is not higher than the price", () => {
  const r = productInputSchema.safeParse({ name: "Test", category: "c", description: "d", price: 100, compareAtPrice: 90 });
  assert.equal(r.success, false);
});

test("seed catalogue is internally consistent", () => {
  const products = seed as unknown as Product[];
  assert.ok(products.length > 40);
  assert.equal(new Set(products.map((p) => p.slug)).size, products.length, "slugs are unique");
  assert.equal(new Set(products.map((p) => p.externalId)).size, products.length, "source ids are unique");
  for (const p of products.filter((x) => x.published)) {
    assert.ok(p.images.length > 0, `${p.name} has images`);
    assert.equal(p.images.filter((i) => i.isPrimary).length, 1, `${p.name} has one primary image`);
    assert.ok(p.description.length > 20, `${p.name} has a description`);
    assert.ok(p.retailerUrl?.startsWith("https://www.unitedsports.lk/products/"), `${p.name} has a retailer URL`);
    assert.ok(p.images.every((i) => isTrustedImageSrc(i.src)), `${p.name} images are trusted`);
  }
});

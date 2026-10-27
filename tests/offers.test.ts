import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount, originalPrice, savingPercent, sellingPrice } from "../src/lib/pricing.ts";
import { applyRetailerOffers, mergeRetailerFields, parseOffersPage, percentFromTitle, resolveOffers } from "../src/lib/retailer-import.ts";
import { queryProducts } from "../src/lib/product-query.ts";
import seed from "../src/data/products.seed.json" with { type: "json" };
import type { Product } from "../src/types/product.ts";

const products = seed as unknown as Product[];

test("offer prices match the retailer's advertised figures", () => {
  // Values copied from unitedsports.lk/pages/anniversary-offers
  assert.equal(applyDiscount(21900, 25), 16425);
  assert.equal(applyDiscount(22350, 15), 18997.5);
  assert.equal(applyDiscount(75000, 10), 67500);
  assert.equal(applyDiscount(1000, undefined), 1000);
});

test("selling/original/saving prices", () => {
  const p = { price: 70000, discountPercent: 20 };
  assert.equal(sellingPrice(p), 56000);
  assert.equal(originalPrice(p), 70000);
  assert.equal(savingPercent(p), 20);
  assert.equal(originalPrice({ price: 100 }), undefined);
  assert.equal(savingPercent({ price: 80, compareAtPrice: 100 }), 20);
  assert.equal(savingPercent({ price: 100, compareAtPrice: 80 }), undefined);
});

test("offers page badges are parsed", () => {
  const html =
    '<x view-event-payload="{&quot;handle&quot;:&quot;wilson-blade-98&quot;}"></x><span class="featured-discount-badge"> 10% OFF </span>' +
    '<x view-event-payload="{&quot;handle&quot;:&quot;wilson-bag&quot;}"></x><span class="featured-discount-badge">25% OFF</span>';
  assert.deepEqual([...parseOffersPage(html)], [
    ["wilson-blade-98", 10],
    ["wilson-bag", 25],
  ]);
  assert.equal(percentFromTitle("Aniversary Discount 15%"), 15);
  assert.equal(percentFromTitle("Mizuno Discount"), undefined);
});

test("page badge wins; unresolved collection conflicts use the lower %", () => {
  const offers = resolveOffers(new Map([["a", 20]]), [
    { handle: "a", percent: 15, collection: "c15" },
    { handle: "a", percent: 20, collection: "c20" },
    { handle: "b", percent: 15, collection: "c15" },
    { handle: "b", percent: 20, collection: "c20" },
    { handle: "c", percent: 10, collection: "c10" },
  ]);
  assert.equal(offers.get("a")!.percent, 20);
  assert.ok(offers.get("a")!.conflict);
  assert.equal(offers.get("b")!.percent, 15);
  assert.equal(offers.get("c")!.percent, 10);
});

test("manual offers survive retailer updates; stale retailer offers are removed", () => {
  const base = products.find((p) => p.discountPercent)!;
  const manual: Product = { ...base, discountPercent: 40, discountSource: "manual" };
  const [kept] = applyRetailerOffers([manual], new Map(), "Anniversary Offer");
  assert.equal(kept!.discountPercent, 40);
  const [cleared] = applyRetailerOffers([base], new Map(), "Anniversary Offer");
  assert.equal(cleared!.discountPercent, undefined);
  const merged = mergeRetailerFields(manual, { ...base, discountPercent: 10, discountSource: "retailer" });
  assert.equal(merged.discountPercent, 40);
});

test("seed catalogue carries the verified anniversary offers", () => {
  const byHandle = new Map(products.map((p) => [p.retailerUrl!.split("/products/")[1], p]));
  assert.equal(byHandle.get("wilson-blade-feel-comp-tennis-racket")!.discountPercent, 25);
  assert.equal(byHandle.get("wilson-blade-98-16x19-tennis-racket-v9")!.discountPercent, 10);
  assert.equal(byHandle.get("wilson-pro-staff-super-tour-tennis-bag-v14-0-15pk")!.discountPercent, 20);
  assert.equal(byHandle.get("wilson-roland-garros-tennis-bag-6pk")!.discountPercent, 15);
  assert.equal(byHandle.get("wilson-us-open-green-tournament-tennis-balls-can")!.discountPercent, undefined);
  assert.ok(products.filter((p) => p.discountPercent).every((p) => p.discountSource === "retailer"));
});

test("catalogue filters and sorts by what customers pay", () => {
  const offers = queryProducts(products, { onOffer: true, pageSize: 500 });
  assert.ok(offers.items.every((p) => savingPercent(p) !== undefined));
  const tier = queryProducts(products, { offerPercent: 25, pageSize: 500 });
  assert.ok(tier.total > 0 && tier.items.every((p) => p.discountPercent === 25));
  const byDiscount = queryProducts(products, { sort: "discount", pageSize: 500 }).items;
  assert.equal(savingPercent(byDiscount[0]!), 25);
  const cheap = queryProducts(products, { maxPrice: 16425, category: ["tennis-rackets"], pageSize: 500 }).items;
  assert.ok(cheap.some((p) => p.slug.startsWith("blade-feel-comp")), "filtered on the offer price, not the original");
});

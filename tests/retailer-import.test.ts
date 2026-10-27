import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, cleanProductName, mapFeed, mergeRetailerFields, parseDescriptionHtml, type ShopifyFeedProduct } from "../src/lib/retailer-import.ts";

const cfg = { baseUrl: "https://www.unitedsports.lk", name: "United Sports", idPrefix: "unitedsports", currency: "LKR" };

const listing = (o: Partial<ShopifyFeedProduct>): ShopifyFeedProduct => ({
  id: 1,
  title: "WILSON Blade 98 Tennis Racket",
  handle: "wilson-blade-98",
  body_html:
    "The Blade is precise.It rewards big swings. Product Code: WR149811U2<hr><strong>Key Features</strong><ul><li>Control</li><li>Spin</li></ul><hr><strong>Specifications</strong><table><tr><td>Model</td><td>Blade 98</td></tr><tr><td>Condition</td><td>New</td></tr><tr><td>Category</td><td>Tennis Racket</td></tr><tr><td>Weight</td><td>305 g</td></tr></table><hr><strong>Perks</strong><table><tr><td>Power</td><td>Medium</td></tr></table><hr><strong>Ideal For</strong><ul><li>Advanced players</li></ul>",
  vendor: "WILSON",
  product_type: "",
  tags: ["wilson-blade-series"],
  created_at: "2026-04-30T15:11:22+05:30",
  updated_at: "2026-10-01T00:00:00+05:30",
  options: [{ name: "Title", values: ["Default Title"] }],
  variants: [{ id: 11, title: "Default Title", option1: "Default Title", option2: null, option3: null, price: "75000.00", compare_at_price: null, available: true }],
  images: [{ src: "https://cdn.shopify.com/s/files/1/0732/7583/4503/files/a.png", width: 1080, height: 1350, position: 1 }],
  ...o,
});

test("description HTML is split into description, features, specs, profile, ideal-for", () => {
  const d = parseDescriptionHtml(listing({}).body_html!);
  assert.equal(d.description, "The Blade is precise. It rewards big swings.");
  assert.equal(d.productCode, "WR149811U2");
  assert.equal(d.model, "Blade 98");
  assert.deepEqual(d.features, ["Control", "Spin"]);
  assert.deepEqual(d.specifications, [{ label: "Weight", value: "305 g" }]);
  assert.deepEqual(d.profile, [{ label: "Power", value: "Medium" }]);
  assert.deepEqual(d.idealFor, ["Advanced players"]);
  assert.equal(d.sourceCategory, "Tennis Racket");
});

test("names and categories are normalised", () => {
  assert.equal(cleanProductName("WILSON SUPER TOUR (V14.0) PRO STAFF BAG (9PK)"), "Super Tour (V14.0) Pro Staff Bag (9PK)");
  assert.equal(cleanProductName("Wilson Ultra 25 (V5) Tennis Racket"), "Ultra 25 (V5) Tennis Racket");
  assert.equal(classify("WILSON Racket Dampeners").category, "tennis-accessories");
  assert.equal(classify("WILSON Team Tennis Bag (3PK)").category, "tennis-bags");
  assert.equal(classify("WILSON Basketball Wave").sport, "basketball");
});

test("non-Wilson listings are ignored, mismatched content becomes a draft", () => {
  const r = mapFeed(
    [
      listing({}),
      listing({ id: 2, title: "YONEX Astrox", vendor: "YONEX", handle: "yonex" }),
      listing({
        id: 3,
        handle: "mismatch",
        title: "WILSON Ultra Team V4 Tennis Racket",
        body_html: "A string.<hr><table><tr><td>Category</td><td>Badminton String</td></tr></table>",
      }),
    ],
    cfg,
  );
  assert.equal(r.imported.length, 2);
  assert.equal(r.imported[0]!.product.published, true);
  assert.equal(r.imported[1]!.product.published, false);
  assert.match(r.imported[1]!.product.adminNotes!, /Badminton String/);
});

test("compare-at prices lower than the price are not treated as sales", () => {
  const r = mapFeed([listing({ variants: [{ ...listing({}).variants[0]!, price: "69000.00", compare_at_price: "55200.00" }] })], cfg);
  assert.equal(r.imported[0]!.product.price, 69000);
  assert.equal(r.imported[0]!.product.compareAtPrice, undefined);
});

test("multi-option listings produce variants and deep-linkable SKUs", () => {
  const r = mapFeed(
    [
      listing({
        options: [
          { name: "Shoe size", values: ["42", "43"] },
          { name: "Color", values: ["White"] },
        ],
        variants: [
          { id: 101, title: "42 / White", option1: "42", option2: "White", option3: null, price: "44000.00", compare_at_price: null, available: false },
          { id: 102, title: "43 / White", option1: "43", option2: "White", option3: null, price: "44000.00", compare_at_price: null, available: true },
        ],
      }),
    ],
    cfg,
  );
  const p = r.imported[0]!.product;
  assert.deepEqual(p.variants, [
    { name: "Shoe size", value: "42", available: false },
    { name: "Shoe size", value: "43", available: true },
  ]);
  assert.deepEqual(p.skus[1], { options: { "Shoe size": "43" }, retailerVariantId: "102", price: 44000, available: true });
});

test("retailer sync refreshes price/stock but keeps admin edits", () => {
  const original = mapFeed([listing({})], cfg).imported[0]!.product;
  const edited = { ...original, name: "Edited name", description: "Edited" };
  const incoming = mapFeed([listing({ variants: [{ ...listing({}).variants[0]!, price: "80000.00", available: false }] })], cfg)
    .imported[0]!.product;
  const merged = mergeRetailerFields(edited, incoming);
  assert.equal(merged.name, "Edited name");
  assert.equal(merged.description, "Edited");
  assert.equal(merged.price, 80000);
  assert.equal(merged.availability, "out_of_stock");
});

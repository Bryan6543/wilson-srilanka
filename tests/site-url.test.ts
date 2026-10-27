import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseSiteUrl } from "../src/lib/seo.ts";

test("site URL: adds a missing scheme and trims trailing slashes", () => {
  assert.equal(normaliseSiteUrl("wilsonsrilanka.lk"), "https://wilsonsrilanka.lk");
  assert.equal(normaliseSiteUrl(" https://www.wilsonsrilanka.lk/ "), "https://www.wilsonsrilanka.lk");
  assert.equal(normaliseSiteUrl("http://localhost:3100"), "http://localhost:3100");
});

test("site URL: falls back to localhost when unset or unusable", () => {
  assert.equal(normaliseSiteUrl(undefined), "http://localhost:3000");
  assert.equal(normaliseSiteUrl("  "), "http://localhost:3000");
  assert.equal(normaliseSiteUrl("not a url"), "http://localhost:3000");
});

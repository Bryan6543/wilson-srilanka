// RFC 4180 CSV parsing/serialisation plus the product <-> CSV column mapping used by
// admin import/export. Multi-value cells use " | " so the file stays editable in Excel.
import type { Product } from "../types/product.ts";

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === "") quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function escapeCell(value: string): string {
  // Neutralise spreadsheet formula injection for cells opened in Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  return "﻿" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}

export const PRODUCT_CSV_COLUMNS = [
  "id",
  "slug",
  "name",
  "model",
  "product_code",
  "category",
  "sport",
  "description",
  "features",
  "specifications",
  "profile",
  "ideal_for",
  "in_the_box",
  "image_urls",
  "image_alts",
  "variants",
  "price",
  "compare_at_price",
  "discount_percent",
  "discount_label",
  "currency",
  "availability",
  "retailer_url",
  "source_url",
  "source_name",
  "external_id",
  "featured",
  "published",
  "tags",
] as const;

export type ProductCsvColumn = (typeof PRODUCT_CSV_COLUMNS)[number];
const SEP = " | ";

const joinLV = (items: { label: string; value: string }[]) => items.map((s) => `${s.label}: ${s.value}`).join(SEP);

export function productToCsvRow(p: Product): string[] {
  const images = [...p.images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const record: Record<ProductCsvColumn, string> = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    model: p.model ?? "",
    product_code: p.productCode ?? "",
    category: p.category,
    sport: p.sport ?? "",
    description: p.description,
    features: p.features.join(SEP),
    specifications: joinLV(p.specifications),
    profile: joinLV(p.profile),
    ideal_for: p.idealFor.join(SEP),
    in_the_box: p.inTheBox.join(SEP),
    image_urls: images.map((i) => i.src).join(SEP),
    image_alts: images.map((i) => i.alt).join(SEP),
    variants: p.variants.map((v) => `${v.name}: ${v.value}${v.available === false ? " (unavailable)" : ""}`).join(SEP),
    price: p.price?.toString() ?? "",
    compare_at_price: p.compareAtPrice?.toString() ?? "",
    discount_percent: p.discountPercent?.toString() ?? "",
    discount_label: p.discountLabel ?? "",
    currency: p.currency ?? "",
    availability: p.availability ?? "",
    retailer_url: p.retailerUrl ?? "",
    source_url: p.sourceUrl ?? "",
    source_name: p.sourceName ?? "",
    external_id: p.externalId ?? "",
    featured: p.featured ? "yes" : "no",
    published: p.published ? "yes" : "no",
    tags: p.tags.join(", "),
  };
  return PRODUCT_CSV_COLUMNS.map((c) => record[c]);
}

export function productsToCsv(products: Product[]): string {
  return toCsv([[...PRODUCT_CSV_COLUMNS], ...products.map(productToCsvRow)]);
}

const splitMulti = (s: string | undefined) =>
  (s ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

const splitLV = (s: string | undefined) =>
  splitMulti(s)
    .map((item) => {
      const idx = item.indexOf(":");
      return idx > 0 ? { label: item.slice(0, idx).trim(), value: item.slice(idx + 1).trim() } : null;
    })
    .filter((x): x is { label: string; value: string } => !!x && !!x.label && !!x.value);

const yes = (s: string | undefined) => /^(yes|y|true|1)$/i.test((s ?? "").trim());
const optNum = (s: string | undefined) => {
  const t = (s ?? "").replace(/[, ]/g, "").replace(/^rs\.?/i, "");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN; // NaN is rejected by validation with a clear message
};

/** Converts one CSV record into an unvalidated product input (validated server-side with Zod). */
export function csvRecordToProductInput(rec: Partial<Record<ProductCsvColumn, string>>) {
  const urls = splitMulti(rec.image_urls);
  const alts = splitMulti(rec.image_alts);
  const name = (rec.name ?? "").trim();
  return {
    id: rec.id?.trim() || undefined,
    slug: rec.slug?.trim() || undefined,
    name,
    model: rec.model?.trim() || undefined,
    productCode: rec.product_code?.trim() || undefined,
    category: (rec.category ?? "").trim(),
    sport: rec.sport?.trim() || undefined,
    description: (rec.description ?? "").trim(),
    features: splitMulti(rec.features),
    specifications: splitLV(rec.specifications),
    profile: splitLV(rec.profile),
    idealFor: splitMulti(rec.ideal_for),
    inTheBox: splitMulti(rec.in_the_box),
    images: urls.map((src, i) => ({ src, alt: alts[i] || `Wilson ${name}`, isPrimary: i === 0 })),
    variants: splitLV(rec.variants).map((v) => {
      const unavailable = /\(unavailable\)$/i.test(v.value);
      return { name: v.label, value: v.value.replace(/\s*\(unavailable\)$/i, ""), available: !unavailable };
    }),
    price: optNum(rec.price),
    compareAtPrice: optNum(rec.compare_at_price),
    discountPercent: optNum(rec.discount_percent?.replace(/%$/, "")),
    discountLabel: rec.discount_label?.trim() || undefined,
    currency: rec.currency?.trim() || undefined,
    availability: rec.availability?.trim() || undefined,
    retailerUrl: rec.retailer_url?.trim() || undefined,
    sourceUrl: rec.source_url?.trim() || undefined,
    sourceName: rec.source_name?.trim() || undefined,
    externalId: rec.external_id?.trim() || undefined,
    featured: yes(rec.featured),
    published: yes(rec.published),
    tags: (rec.tags ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  };
}

/** Parses a whole CSV file into header-keyed records. Throws when required headers are missing. */
export function csvToRecords(text: string): Partial<Record<ProductCsvColumn, string>>[] {
  const rows = parseCsv(text);
  const header = rows[0]?.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  if (!header) throw new Error("The CSV file is empty.");
  for (const required of ["name", "category", "description"]) {
    if (!header.includes(required)) throw new Error(`Missing required column "${required}".`);
  }
  return rows.slice(1).map((r) => {
    const rec: Partial<Record<ProductCsvColumn, string>> = {};
    header.forEach((h, i) => {
      if ((PRODUCT_CSV_COLUMNS as readonly string[]).includes(h)) {
        // Undo the formula-injection guard applied on export.
        rec[h as ProductCsvColumn] = (r[i] ?? "").replace(/^'(?=[=+\-@])/, "");
      }
    });
    return rec;
  });
}

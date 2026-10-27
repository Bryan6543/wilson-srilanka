"use client";

import { useState } from "react";
import { ExternalLink, Store } from "lucide-react";
import Link from "next/link";
import type { Product, ProductSku } from "@/types/product";
import { buildPurchaseUrl, retailerHostname } from "@/lib/retailer-link";
import { applyDiscount, hasOffer } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";

type Selection = Record<string, string>;

function groupOptions(product: Pick<Product, "variants">) {
  const groups = new Map<string, { value: string; available?: boolean }[]>();
  for (const v of product.variants) {
    if (!groups.has(v.name)) groups.set(v.name, []);
    groups.get(v.name)!.push({ value: v.value, available: v.available });
  }
  return [...groups.entries()];
}

function findSku(skus: ProductSku[], sel: Selection): ProductSku | undefined {
  return skus.find((s) => Object.entries(s.options).every(([k, v]) => sel[k] === v));
}

/** Variant selection plus the external "Buy from retailer" call to action. */
export function PurchasePanel({
  product,
  retailerName,
  utmSource,
}: {
  product: Pick<Product, "name" | "variants" | "skus" | "retailerUrl" | "availability" | "currency" | "price" | "discountPercent">;
  retailerName: string;
  utmSource?: string;
}) {
  const groups = groupOptions(product);
  const firstAvailable = product.skus.find((s) => s.available) ?? product.skus[0];
  const [selection, setSelection] = useState<Selection>(() => ({ ...(firstAvailable?.options ?? {}) }));

  const complete = groups.every(([name]) => selection[name]);
  const sku = complete ? findSku(product.skus, selection) : undefined;
  const comboAvailable = sku ? sku.available !== false : undefined;
  const href = buildPurchaseUrl(product.retailerUrl, { variantId: sku?.retailerVariantId, utmSource });
  const host = retailerHostname(product.retailerUrl);

  const isOptionAvailable = (name: string, value: string) => {
    if (!product.skus.length) return product.variants.find((v) => v.name === name && v.value === value)?.available !== false;
    // Available if some in-stock SKU matches this value and the other current selections.
    return product.skus.some(
      (s) =>
        s.available !== false &&
        s.options[name] === value &&
        Object.entries(selection).every(([k, v]) => k === name || !s.options[k] || s.options[k] === v),
    );
  };

  return (
    <div className="space-y-6">
      {groups.map(([name, values]) => (
        <fieldset key={name}>
          <legend className="mb-3 text-sm">
            <span className="font-semibold">{name}:</span> {selection[name] ?? <span className="text-muted">Select</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {values.map(({ value }) => {
              const checked = selection[name] === value;
              const available = isOptionAvailable(name, value);
              return (
                <label
                  key={value}
                  className={cn(
                    "relative flex min-h-11 min-w-12 cursor-pointer items-center justify-center rounded-sm border px-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                    checked ? "border-ink-strong bg-ink-strong text-white" : "border-line hover:border-ink-soft",
                    !available && !checked && "text-muted line-through",
                  )}
                >
                  <input
                    type="radio"
                    name={`opt-${name}`}
                    value={value}
                    checked={checked}
                    onChange={() => setSelection((s) => ({ ...s, [name]: value }))}
                    className="sr-only"
                  />
                  {value}
                  {!available && <span className="sr-only"> (unavailable)</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {sku?.price !== undefined && sku.price !== product.price && (
        <p className="text-sm">
          Selected option:{" "}
          {hasOffer({ price: sku.price, discountPercent: product.discountPercent }) ? (
            <>
              <span className="font-semibold text-accent">{formatPrice(applyDiscount(sku.price, product.discountPercent), product.currency)}</span>{" "}
              <s className="text-muted">{formatPrice(sku.price, product.currency)}</s>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(sku.price, product.currency)}</span>
          )}
        </p>
      )}
      {comboAvailable === false && (
        <p className="text-sm text-muted" role="status">
          This option is currently out of stock at {retailerName}.
        </p>
      )}

      {href ? (
        <div className="space-y-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full"
            aria-describedby="buy-note"
          >
            {product.availability === "out_of_stock" || comboAvailable === false ? `View at ${retailerName}` : `Buy from ${retailerName}`}
            <ExternalLink aria-hidden className="size-4" />
          </a>
          <p id="buy-note" className="text-center text-xs text-muted">
            Opens {host ?? "the retailer's website"} in a new tab. Checkout, payment and delivery are handled by {retailerName}.
          </p>
        </div>
      ) : (
        <div className="rounded-sm border border-line bg-surface-alt p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Store aria-hidden className="size-4" /> Not currently sold online
          </p>
          <p className="mt-1 text-muted">
            Contact the store to ask about availability.{" "}
            <Link href="/contact" className="link-underline text-ink">
              Contact details
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

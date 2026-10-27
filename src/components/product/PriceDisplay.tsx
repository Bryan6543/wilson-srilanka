import type { Availability, Product } from "@/types/product";
import { originalPrice, savingPercent, sellingPrice } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";

export function hasRangedPrice(p: Pick<Product, "skus">): boolean {
  const prices = new Set(p.skus.map((s) => s.price).filter((x): x is number => typeof x === "number"));
  return prices.size > 1;
}

export function PriceDisplay({
  product,
  size = "sm",
  className,
}: {
  product: Pick<Product, "price" | "compareAtPrice" | "discountPercent" | "currency" | "skus">;
  size?: "sm" | "lg";
  className?: string;
}) {
  const now = sellingPrice(product);
  if (now === undefined) {
    return <p className={cn("text-sm text-muted", className)}>Price on request</p>;
  }
  const was = originalPrice(product);
  const saving = savingPercent(product);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", size === "lg" ? "text-2xl" : "text-sm", className)}>
      {hasRangedPrice(product) && <span className="text-muted">From</span>}
      <span className={cn("font-semibold", was !== undefined && "text-accent")}>
        {was !== undefined && <span className="sr-only">Offer price </span>}
        {formatPrice(now, product.currency)}
      </span>
      {was !== undefined && (
        <>
          <s className={cn("text-muted", size === "lg" ? "text-base" : "text-xs")}>
            <span className="sr-only">Regular price </span>
            {formatPrice(was, product.currency)}
          </s>
          {saving !== undefined && (
            <span
              className={cn(
                "font-extended self-center bg-accent text-white",
                size === "lg" ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9px]",
              )}
            >
              −{saving}%<span className="sr-only"> off</span>
            </span>
          )}
        </>
      )}
    </p>
  );
}

/** "You save Rs. 18,750" line for product pages. */
export function SavingNote({
  product,
  retailerName,
  className,
}: {
  product: Pick<Product, "price" | "compareAtPrice" | "discountPercent" | "discountLabel" | "currency" | "discountSource">;
  retailerName?: string;
  className?: string;
}) {
  const now = sellingPrice(product);
  const was = originalPrice(product);
  if (now === undefined || was === undefined) return null;
  return (
    <div className={className}>
      <p className="text-sm text-accent">
        You save <strong>{formatPrice(was - now, product.currency)}</strong>
        {product.discountLabel && product.discountPercent ? ` · ${product.discountLabel}` : ""}
      </p>
      {!!product.discountPercent && !!retailerName && (
        <p className="mt-1 text-xs text-muted">
          Offer price as advertised by {retailerName}. The final price is confirmed at {retailerName}’s checkout or in store.
        </p>
      )}
    </div>
  );
}

const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: "In stock at retailer",
  out_of_stock: "Currently out of stock",
  preorder: "Available to pre-order",
  unknown: "Check availability with retailer",
};

export function AvailabilityBadge({ availability, className }: { availability?: Availability; className?: string }) {
  if (!availability) return null;
  const tone =
    availability === "in_stock"
      ? "bg-success"
      : availability === "out_of_stock"
        ? "bg-muted"
        : availability === "preorder"
          ? "bg-warning"
          : "bg-line";
  return (
    <p className={cn("flex items-center gap-2 text-sm", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", tone)} />
      {AVAILABILITY_LABEL[availability]}
    </p>
  );
}

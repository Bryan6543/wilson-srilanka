"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { primaryImage } from "@/lib/product-query";
import { SafeImage } from "@/components/ui/SafeImage";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/ui/States";
import { PriceDisplay, AvailabilityBadge } from "@/components/product/PriceDisplay";
import { useWishlist } from "@/components/wishlist/wishlist-store";

export function WishlistView() {
  const { items, remove, clear } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const key = items.join(",");

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { products: Product[] }) => {
        setProducts(d.products);
        setError(false);
      })
      .catch(() => !ctrl.signal.aborted && setError(true));
    return () => ctrl.abort();
  }, [key]);

  if (!items.length) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        body="Tap the heart on any product to save it here for later."
        action={{ label: "Browse products", href: "/products" }}
      />
    );
  }
  if (error) {
    return <ErrorState title="We couldn't load your wishlist" body="Please refresh the page to try again." />;
  }
  if (!products) return <ProductGridSkeleton count={Math.min(items.length, 4)} />;

  // Keep the saved order; drop products that are no longer published.
  const ordered = items.map((s) => products.find((p) => p.slug === s)).filter((p): p is Product => !!p);
  const missing = items.length - ordered.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm">
        <p className="text-muted">
          {ordered.length} saved {ordered.length === 1 ? "product" : "products"}
          {missing > 0 && ` · ${missing} no longer available`}
        </p>
        <button type="button" onClick={clear} className="underline">
          Clear wishlist
        </button>
      </div>
      <ul className="divide-y divide-line-soft border-y border-line-soft">
        {ordered.map((p) => {
          const img = primaryImage(p);
          return (
            <li key={p.id} className="flex gap-4 py-5 sm:gap-6">
              <Link href={`/products/${p.slug}`} className="relative aspect-[4/5] w-24 shrink-0 bg-surface-warm sm:w-32">
                <SafeImage src={img?.src} alt={img?.alt ?? p.name} fill sizes="128px" className="object-contain mix-blend-multiply" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/products/${p.slug}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
                <PriceDisplay product={p} />
                <AvailabilityBadge availability={p.availability} className="text-xs" />
                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  <Link href={`/products/${p.slug}`} className="btn btn-primary btn-sm">
                    View product
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.slug)}
                    className="btn btn-secondary btn-sm"
                    aria-label={`Remove ${p.name} from wishlist`}
                  >
                    <Trash2 aria-hidden className="size-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

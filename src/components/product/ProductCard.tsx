import Link from "next/link";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/ui/SafeImage";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { savingPercent } from "@/lib/pricing";
import { primaryImage } from "@/lib/product-query";
import { PriceDisplay } from "./PriceDisplay";

const NEW_WINDOW_DAYS = 45;

export function isRecentlyAdded(p: Pick<Product, "createdAt">, now = Date.now()) {
  return now - new Date(p.createdAt).getTime() < NEW_WINDOW_DAYS * 86_400_000;
}

export function ProductCard({
  product,
  categoryName,
  priority = false,
}: {
  product: Product;
  categoryName?: string;
  priority?: boolean;
}) {
  const img = primaryImage(product);
  const secondary = product.images.find((i) => i !== img);
  const saving = savingPercent(product);
  const outOfStock = product.availability === "out_of_stock";
  const isNew = isRecentlyAdded(product);

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-warm">
        <SafeImage
          src={img?.src}
          alt={img?.alt ?? product.name}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
          // Both photos blend with the tile, so the first must fade out for the second to show cleanly.
          className={`object-contain mix-blend-multiply transition duration-500 group-hover:scale-[1.03] ${secondary ? "md:group-hover:opacity-0" : ""}`}
        />
        {secondary && (
          <SafeImage
            src={secondary.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
            className="hidden object-contain opacity-0 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-100 md:block"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {saving !== undefined && (
            <span className="font-extended bg-accent px-2 py-1 text-[10px] text-white">{saving}% off</span>
          )}
          {isNew && !outOfStock && <span className="font-extended bg-white px-2 py-1 text-[10px]">New</span>}
          {outOfStock && <span className="font-extended bg-white/90 px-2 py-1 text-[10px] text-muted">Out of stock</span>}
        </div>
        <WishlistButton slug={product.slug} name={product.name} className="absolute right-2 top-2 z-10" />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        {categoryName && <p className="text-xs text-muted">{categoryName}</p>}
        <h3 className="text-sm font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 hover:underline">
            {product.name}
          </Link>
        </h3>
        <PriceDisplay product={product} className="mt-auto pt-1" />
      </div>
    </article>
  );
}

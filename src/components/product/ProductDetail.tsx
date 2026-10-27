import Link from "next/link";
import type { Category, Product } from "@/types/product";
import { SPORTS } from "@/data/categories";
import { absoluteUrl } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { sellingPrice } from "@/lib/pricing";
import { AvailabilityBadge, PriceDisplay, SavingNote } from "./PriceDisplay";
import { ProductGallery } from "./ProductGallery";
import { ProductSpecifications } from "./ProductSpecifications";
import { PurchasePanel } from "./VariantSelector";
import { ShareButton } from "./ShareButton";

export function ProductDetail({
  product,
  category,
  retailerName,
  utmSource,
  related,
}: {
  product: Product;
  category: Category | null;
  retailerName: string;
  utmSource?: string;
  related?: React.ReactNode;
}) {
  const crumbs = [
    { label: "Products", href: "/products" },
    ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
    { label: product.name, href: `/products/${product.slug}` },
  ];

  return (
    <>
      <div className="container-site pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <div className="container-site mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-extended text-[11px] text-muted">
            Wilson{product.sport && SPORTS[product.sport] ? ` · ${SPORTS[product.sport]}` : ""}
            {category ? ` · ${category.name}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{product.name}</h1>
          <PriceDisplay product={product} size="lg" className="mt-4" />
          <SavingNote product={product} retailerName={retailerName} className="mt-1" />
          <AvailabilityBadge availability={product.availability} className="mt-2" />

          <div className="mt-8">
            <PurchasePanel product={product} retailerName={retailerName} utmSource={utmSource} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <WishlistButton slug={product.slug} name={product.name} variant="full" className="flex-1" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <ShareButton title={`Wilson ${product.name}`} url={absoluteUrl(`/products/${product.slug}`)} />
            {product.sourceUrl && (
              <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:underline">
                Source: {product.sourceName ?? "product listing"}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>

          {product.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Collections">
              {product.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/products?tag=${encodeURIComponent(t)}`}
                    className="inline-block rounded-sm border border-line px-2 py-1 text-xs capitalize hover:border-ink"
                  >
                    {t.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="container-site mt-16 grid grid-cols-[minmax(0,1fr)] gap-12 border-t border-line-soft pt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <section aria-labelledby="desc-h">
          <h2 id="desc-h" className="font-display text-4xl">Overview</h2>
          <div className="prose-wilson mt-4 text-base leading-relaxed text-ink-soft">
            {product.description.split(/\n{2,}/).map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
        </section>
        <ProductSpecifications product={product} />
      </div>
      {related}
    </>
  );
}

/** schema.org Product data built only from real fields — no ratings or reviews. */
export function productJsonLd(product: Product, categoryName?: string) {
  const availability: Record<string, string> = {
    in_stock: "https://schema.org/InStock",
    out_of_stock: "https://schema.org/OutOfStock",
    preorder: "https://schema.org/PreOrder",
  };
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Wilson ${product.name}`,
    description: product.description,
    brand: { "@type": "Brand", name: "Wilson" },
    image: product.images.map((i) => absoluteUrl(i.src)),
    url: absoluteUrl(`/products/${product.slug}`),
    ...(product.productCode ? { sku: product.productCode, mpn: product.productCode } : {}),
    ...(product.model ? { model: product.model } : {}),
    ...(categoryName ? { category: categoryName } : {}),
  };
  const price = sellingPrice(product);
  if (price !== undefined && product.currency && product.retailerUrl) {
    data.offers = {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: product.currency,
      url: product.retailerUrl,
      ...(product.availability && availability[product.availability]
        ? { availability: availability[product.availability] }
        : {}),
      ...(product.sourceName ? { seller: { "@type": "Organization", name: product.sourceName } } : {}),
    };
  }
  return data;
}

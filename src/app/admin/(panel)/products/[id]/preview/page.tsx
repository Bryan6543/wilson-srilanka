import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/server/database";
import { retailerConfig } from "@/lib/server/env";
import { ProductDetail } from "@/components/product/ProductDetail";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Renders the real product page layout for any product, including drafts (admin only). */
export default async function PreviewProductPage({ params }: PageProps<"/admin/products/[id]/preview">) {
  const { id } = await params;
  const store = getStore();
  const [product, categories] = await Promise.all([store.getProduct(id), store.listCategories()]);
  if (!product) notFound();
  const retailer = retailerConfig();
  return (
    <div className="-mx-4 -my-6 bg-white pb-16 md:-mx-8 md:-my-8">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-warning-bg px-4 py-3 text-sm text-warning md:px-8">
        <span>
          <strong>Preview</strong> — {product.published ? "this product is published." : "this draft is not visible to the public."}
        </span>
        <Link href={`/admin/products/${product.id}`} className="font-semibold underline">
          Back to editor
        </Link>
      </div>
      <ProductDetail
        product={product}
        category={categories.find((c) => c.slug === product.category) ?? null}
        retailerName={retailer.name}
        utmSource={retailer.utmSource}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getStore } from "@/lib/server/database";
import { env } from "@/lib/server/env";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const store = getStore();
  const [product, categories] = await Promise.all([store.getProduct(id), store.listCategories()]);
  if (!product) notFound();
  const notice = sp.created
    ? "Product created."
    : sp.saved === "published"
      ? "Changes saved and published — the public page is updated."
      : sp.saved === "draft"
        ? "Saved as a draft (not visible on the website)."
        : sp.duplicated
          ? "This is a draft copy — edit the details, then publish."
          : undefined;
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/products" className="text-sm underline">
        ← Products
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {product.published && (
          <Link href={`/products/${product.slug}`} target="_blank" className="flex items-center gap-1 text-sm underline">
            View on site <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        )}
      </div>
      <ProductEditor
        key={product.updatedAt}
        product={product}
        categories={categories}
        canSave={store.writable}
        retailerName={env.retailerName}
        notice={notice}
      />
    </div>
  );
}

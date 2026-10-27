import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProductBySlug, getPublishedProducts } from "@/lib/catalog";
import { primaryImage, relatedProducts } from "@/lib/product-query";
import { retailerConfig } from "@/lib/server/env";
import { jsonLd } from "@/lib/seo";
import { truncate } from "@/lib/utils";
import { ProductDetail, productJsonLd } from "@/components/product/ProductDetail";
import { RelatedProducts } from "@/components/product/RelatedProducts";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublishedProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const img = primaryImage(product);
  const description = truncate(product.description, 155);
  return {
    title: `Wilson ${product.name}`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `Wilson ${product.name}`,
      description,
      images: img ? [{ url: img.src, alt: img.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, all, categories] = await Promise.all([getProductBySlug(slug), getPublishedProducts(), getCategories()]);
  if (!product) notFound();
  const category = categories.find((c) => c.slug === product.category) ?? null;
  const retailer = retailerConfig();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, category?.name)) }}
      />
      <ProductDetail
        product={product}
        category={category}
        retailerName={retailer.name}
        utmSource={retailer.utmSource}
        related={<RelatedProducts products={relatedProducts(all, product)} categories={categories} />}
      />
    </>
  );
}

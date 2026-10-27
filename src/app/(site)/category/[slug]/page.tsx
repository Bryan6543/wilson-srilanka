import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategory, getPublishedProducts } from "@/lib/catalog";
import { CatalogView } from "@/components/product/CatalogView";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `Wilson ${category.name}`,
    description: category.description || `Shop Wilson ${category.name.toLowerCase()} in Sri Lanka.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: category.image ? { images: [{ url: category.image }] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const count = (await getPublishedProducts()).filter((p) => p.category === slug).length;
  return (
    <CatalogView
      basePath={`/category/${slug}`}
      params={await searchParams}
      fixedCategory={slug}
      title={category.name}
      intro={
        <>
          {category.description} <span className="text-muted">({count} {count === 1 ? "product" : "products"})</span>
        </>
      }
      crumbs={[
        { label: "Products", href: "/products" },
        { label: category.name, href: `/category/${slug}` },
      ]}
    />
  );
}

import type { MetadataRoute } from "next";
import { getCategoriesWithCounts, getPublishedProducts } from "@/lib/catalog";
import { publishedStories } from "@/data/stories";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

// Only published products, visible categories with products, and published stories.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategoriesWithCounts()]);
  const staticPages = ["/", "/offers", "/products", "/technologies", "/stories", "/about", "/contact", "/privacy", "/terms"];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.slice(0, 1).map((i) => absoluteUrl(i.src)),
    })),
    ...publishedStories().map((s) => ({ url: absoluteUrl(`/stories/${s.slug}`), lastModified: s.date, priority: 0.4 })),
  ];
}

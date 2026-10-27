import { NextResponse, type NextRequest } from "next/server";
import { getCategories, getPublishedProducts } from "@/lib/catalog";
import { originalPrice, sellingPrice } from "@/lib/pricing";
import { primaryImage, queryProducts } from "@/lib/product-query";

/** Lightweight typeahead suggestions for the search overlay (published products only). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  const names = new Map(categories.map((c) => [c.slug, c.name]));
  const { items } = queryProducts(products, { q, pageSize: 6 });
  return NextResponse.json(
    {
      results: items.map((p) => ({
        slug: p.slug,
        name: p.name,
        category: names.get(p.category) ?? p.category,
        price: sellingPrice(p),
        wasPrice: originalPrice(p),
        currency: p.currency,
        image: primaryImage(p)?.src,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}

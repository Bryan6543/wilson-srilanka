import { NextResponse, type NextRequest } from "next/server";
import { getPublishedProducts } from "@/lib/catalog";

/** Card data for a list of slugs (used by the wishlist). Published products only. */
export async function GET(req: NextRequest) {
  const slugs = (req.nextUrl.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,96}$/.test(s))
    .slice(0, 100);
  if (!slugs.length) return NextResponse.json({ products: [] });
  const wanted = new Set(slugs);
  const products = (await getPublishedProducts()).filter((p) => wanted.has(p.slug));
  return NextResponse.json({ products }, { headers: { "Cache-Control": "private, max-age=60" } });
}

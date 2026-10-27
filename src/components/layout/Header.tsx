import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/catalog";
import { SPORTS } from "@/data/categories";
import { Logo } from "@/components/ui/Logo";
import { WishlistCount } from "@/components/wishlist/WishlistButton";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { SearchOverlay } from "./SearchOverlay";
import type { NavSport } from "./nav-types";

export async function buildNavSports(): Promise<NavSport[]> {
  const categories = await getCategoriesWithCounts();
  const bySport = new Map<string, NavSport>();
  for (const c of categories) {
    const key = c.sport ?? "other";
    if (!bySport.has(key)) {
      bySport.set(key, {
        key,
        label: SPORTS[key] ?? "More",
        href: `/products?sport=${encodeURIComponent(key)}`,
        categories: [],
      });
    }
    bySport.get(key)!.categories.push({ slug: c.slug, name: c.name, count: c.count, image: c.image, sport: c.sport });
  }
  return [...bySport.values()];
}

export async function Header({ retailerName }: { retailerName: string }) {
  const sports = await buildNavSports();
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-white">
      <div className="hidden border-b border-line-soft bg-surface-alt lg:block">
        <div className="container-site flex h-8 items-center justify-end gap-6 text-xs">
          <span className="text-muted">Available in Sri Lanka through {retailerName}</span>
          <Link href="/contact" className="flex items-center gap-1 hover:underline">
            <MapPin aria-hidden className="size-3.5" /> Find the store
          </Link>
        </div>
      </div>
      <div className="container-site relative flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:gap-8">
          <MobileNavigation sports={sports} />
          <Link href="/" aria-label="Wilson Sri Lanka home" className="shrink-0">
            <Logo />
          </Link>
          <DesktopNavigation sports={sports} />
        </div>
        <div className="flex items-center gap-1">
          <SearchOverlay />
          <Link href="/wishlist" aria-label="Wishlist" className="relative flex size-10 items-center justify-center">
            <Heart aria-hidden className="size-5" />
            <WishlistCount />
          </Link>
        </div>
      </div>
    </header>
  );
}

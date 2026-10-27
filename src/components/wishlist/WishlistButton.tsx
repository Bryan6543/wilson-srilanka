"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "./wishlist-store";

export function WishlistButton({
  slug,
  name,
  variant = "icon",
  className,
}: {
  slug: string;
  name: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  const label = saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`;

  if (variant === "full") {
    return (
      <button type="button" onClick={() => toggle(slug)} aria-pressed={saved} className={cn("btn btn-secondary", className)}>
        <Heart aria-hidden className={cn("size-4", saved && "fill-accent text-accent")} />
        {saved ? "Saved" : "Save to wishlist"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(slug);
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white",
        className,
      )}
    >
      <Heart aria-hidden className={cn("size-4", saved && "fill-accent text-accent")} />
    </button>
  );
}

export function WishlistCount() {
  const { items } = useWishlist();
  if (!items.length) return null;
  return (
    <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-white">
      <span className="sr-only">, </span>
      {items.length}
      <span className="sr-only"> saved</span>
    </span>
  );
}

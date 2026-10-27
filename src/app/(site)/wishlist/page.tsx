import type { Metadata } from "next";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="container-site pt-10">
      <h1 className="font-display text-5xl md:text-7xl">Wishlist</h1>
      <p className="mt-3 text-ink-soft">Products you’ve saved on this device.</p>
      <div className="mt-10">
        <WishlistView />
      </div>
    </div>
  );
}

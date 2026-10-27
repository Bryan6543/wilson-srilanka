import type { SiteContent } from "../types/product.ts";

// Default homepage / contact content. Editable in Admin → Site content when storage is
// configured. Contact details are taken from https://www.unitedsports.lk/pages/united-sports
export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcement: {
    enabled: true,
    text: "Wilson Anniversary Offers — up to {maxDiscount}% off Wilson rackets, bags & more. Shop the offers",
    href: "/offers",
  },
  hero: {
    eyebrow: "Wilson Tennis",
    title: "Built for the big moments",
    subtitle:
      "Blade, Clash, Pro Staff and Ultra rackets, plus bags, balls and shoes. Prices in rupees, available in Sri Lanka.",
    ctaLabel: "Shop rackets",
    ctaHref: "/category/tennis-rackets",
    image: "/images/campaign/racket-wall.webp",
    imageAlt: "Three Wilson tennis rackets with the red W string stencil hanging on a wooden wall",
  },
  saleBanner: {
    image: "/images/campaign/performance.webp",
    imageAlt: "A Wilson professional player holding a green Wilson Blade tennis racket",
  },
  spotlight: {
    title: "Visit the store",
    body: "See the Wilson range in person at United Sports in Colombo 03, or call ahead to check stock, grip sizes and stringing.",
    ctaLabel: "Store & contact details",
    ctaHref: "/contact",
    image: "/images/campaign/custom.webp",
    imageAlt: "Close-up of Wilson racket frames and strings with design guide markings",
  },
  contact: {
    retailerName: "United Sports (Pvt) Ltd",
    address: "No. 245, R. A. De Mel Mawatha, Colombo 03, Sri Lanka",
    phones: ["011-2574797", "077-8437017"],
    email: "unitedsports@sltnet.lk",
    facebook: "https://www.facebook.com/UnitedSportsSL/",
    instagram: "https://www.instagram.com/unitedsports.lk/",
  },
  footerNote:
    "Wilson and the W logo are trademarks of Wilson Sporting Goods Co. Prices and availability are set by the retailer and may change.",
};

/** Fills in defaults for fields added after content was first saved. */
export function withContentDefaults(stored: Partial<SiteContent> | undefined): SiteContent {
  const s = stored ?? {};
  return {
    ...DEFAULT_SITE_CONTENT,
    ...s,
    announcement: { ...DEFAULT_SITE_CONTENT.announcement, ...s.announcement },
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...s.hero },
    saleBanner: { ...DEFAULT_SITE_CONTENT.saleBanner, ...s.saleBanner },
    spotlight: { ...DEFAULT_SITE_CONTENT.spotlight, ...s.spotlight },
    contact: { ...DEFAULT_SITE_CONTENT.contact, ...s.contact },
  };
}

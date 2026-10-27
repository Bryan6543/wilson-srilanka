export type Availability = "in_stock" | "out_of_stock" | "preorder" | "unknown";

export interface ProductImage {
  src: string;
  alt: string;
  isPrimary: boolean;
  width?: number;
  height?: number;
}

export interface LabelValue {
  label: string;
  value: string;
}

/** One selectable option value, e.g. { name: "Shoe size", value: "42" }. */
export interface ProductVariant {
  name: string;
  value: string;
  available?: boolean;
}

/**
 * A concrete purchasable combination at the retailer (e.g. size 42 / Navy).
 * `retailerVariantId` lets the purchase button deep-link to the exact variant.
 */
export interface ProductSku {
  options: Record<string, string>;
  retailerVariantId?: string;
  price?: number;
  available?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: "Wilson";
  model?: string;
  productCode?: string;
  category: string;
  sport?: string;
  description: string;
  features: string[];
  specifications: LabelValue[];
  /** Playing-characteristic ratings exactly as published by the source listing. */
  profile: LabelValue[];
  idealFor: string[];
  inTheBox: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  skus: ProductSku[];
  /** Regular selling price at the retailer. */
  price?: number;
  compareAtPrice?: number;
  /**
   * Percentage offer applied to `price` (e.g. 25 → 25% off), as advertised by the retailer
   * or set by an administrator. The offer price is calculated, never stored separately.
   */
  discountPercent?: number;
  /** Short offer name shown with the badge, e.g. "Anniversary Offer". */
  discountLabel?: string;
  /** "retailer" offers are refreshed by retailer sync; "manual" offers are never overwritten. */
  discountSource?: "retailer" | "manual";
  currency?: string;
  availability?: Availability;
  retailerUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  /** Stable identifier from the import source, used for duplicate detection. */
  externalId?: string;
  featured: boolean;
  published: boolean;
  tags: string[];
  /** Internal notes for administrators (never shown publicly). */
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  slug: string;
  name: string;
  sport?: string;
  description: string;
  image?: string;
  sortOrder: number;
  visible: boolean;
}

export interface SiteContent {
  announcement: { enabled: boolean; text: string; href?: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
    imageAlt: string;
  };
  /** Photo on the first homepage sale banner. Use only images you have the rights to. */
  saleBanner: {
    image: string;
    imageAlt: string;
  };
  spotlight: {
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
    imageAlt: string;
  };
  contact: {
    retailerName: string;
    address: string;
    phones: string[];
    email: string;
    hours?: string;
    facebook?: string;
    instagram?: string;
  };
  footerNote: string;
}

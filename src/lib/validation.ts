import { z } from "zod";
import { isHttpUrl, slugify } from "./utils.ts";

/**
 * Image sources the site will render. Must stay in sync with `images.remotePatterns`
 * in next.config.ts. Supabase Storage is added at runtime when configured.
 */
export const TRUSTED_IMAGE_PREFIXES = [
  "https://cdn.shopify.com/s/files/1/0732/7583/4503/",
  "https://cdn.shopify.com/s/files/1/0996/7373/5482/",
  "https://www.wilson.com/cdn/shop/",
];

export function isTrustedImageSrc(src: string, supabaseUrl?: string): boolean {
  if (/^\/(images|brand|api\/media)\/[\w\-./]+$/.test(src) && !src.includes("..")) return true;
  if (!isHttpUrl(src) || !src.startsWith("https://")) return false;
  if (TRUSTED_IMAGE_PREFIXES.some((p) => src.startsWith(p))) return true;
  if (supabaseUrl) {
    const base = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/`;
    if (src.startsWith(base)) return true;
  }
  return false;
}

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v) && isHttpUrl(v), "Must be a full web address starting with https://");

const optionalUrl = z
  .union([httpUrl, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

const money = z
  .number({ error: "Enter a number" })
  .finite("Enter a valid amount")
  .nonnegative("Price cannot be negative")
  .max(100_000_000, "Price looks too large")
  .optional();

const labelValue = z.object({ label: text(80).min(1), value: text(400).min(1) });

export const productImageSchema = z.object({
  src: z.string().trim().min(1).max(2048),
  alt: text(300).min(1, "Every image needs alternative text"),
  isPrimary: z.boolean(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const AVAILABILITY_VALUES = ["in_stock", "out_of_stock", "preorder", "unknown"] as const;

export const productInputSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    slug: z
      .string()
      .trim()
      .max(96)
      .optional()
      .transform((v) => (v ? slugify(v) : undefined)),
    name: text(160).min(2, "Product name is required"),
    model: optionalText(160),
    productCode: optionalText(80),
    category: text(80).min(1, "Choose a category"),
    sport: optionalText(40),
    description: text(6000).min(1, "Description is required"),
    features: z.array(text(400).min(1)).max(40).default([]),
    specifications: z.array(labelValue).max(60).default([]),
    profile: z.array(labelValue).max(20).default([]),
    idealFor: z.array(text(400).min(1)).max(20).default([]),
    inTheBox: z.array(text(400).min(1)).max(20).default([]),
    images: z.array(productImageSchema).max(20, "Up to 20 images per product").default([]),
    variants: z
      .array(z.object({ name: text(60).min(1), value: text(120).min(1), available: z.boolean().optional() }))
      .max(200)
      .default([]),
    skus: z
      .array(
        z.object({
          options: z.record(z.string().max(60), z.string().max(120)),
          retailerVariantId: z.string().regex(/^\d{1,20}$/).optional(),
          price: money,
          available: z.boolean().optional(),
        }),
      )
      .max(500)
      .default([]),
    price: money,
    compareAtPrice: money,
    discountPercent: z
      .number({ error: "Enter a whole number" })
      .int("Use a whole number, e.g. 25")
      .min(1, "Discount must be between 1 and 90%")
      .max(90, "Discount must be between 1 and 90%")
      .optional(),
    discountLabel: optionalText(40),
    discountSource: z.enum(["retailer", "manual"]).optional(),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code such as LKR")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    availability: z.enum(AVAILABILITY_VALUES).optional().or(z.literal("").transform(() => undefined)),
    retailerUrl: optionalUrl,
    sourceUrl: optionalUrl,
    sourceName: optionalText(120),
    externalId: optionalText(120),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    tags: z.array(text(40).min(1)).max(30).default([]),
    adminNotes: optionalText(4000),
  })
  .superRefine((p, ctx) => {
    if (p.compareAtPrice !== undefined && (p.price === undefined || p.compareAtPrice <= p.price)) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "The 'was' price must be higher than the current price",
      });
    }
    if (p.discountPercent !== undefined && p.price === undefined) {
      ctx.addIssue({ code: "custom", path: ["discountPercent"], message: "Add a price before setting a discount" });
    }
    if (p.discountPercent !== undefined && p.compareAtPrice !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPercent"],
        message: "Use either an offer discount or a 'was' price, not both",
      });
    }
    if (p.images.length && p.images.filter((i) => i.isPrimary).length !== 1) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Choose exactly one primary image" });
    }
    if (p.published && !p.images.length) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Add at least one image before publishing" });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  name: text(80).min(2),
  sport: optionalText(40),
  description: text(1000).default(""),
  image: optionalText(2048),
  sortOrder: z.number().int().min(0).max(999).default(100),
  visible: z.boolean().default(true),
});

export const siteContentSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    text: text(200),
    href: z
      .string()
      .trim()
      .max(300)
      .regex(/^(\/[\w\-/?=&.%]*)?$/, "Use an internal link starting with /")
      .optional()
      .transform((v) => (v ? v : undefined)),
  }),
  hero: z.object({
    eyebrow: text(80),
    title: text(120).min(1),
    subtitle: text(400),
    ctaLabel: text(40).min(1),
    ctaHref: z.string().trim().regex(/^\/[\w\-/?=&.%]*$/, "Use an internal link starting with /"),
    image: z.string().trim().min(1).max(2048),
    imageAlt: text(300).min(1),
  }),
  saleBanner: z.object({
    image: z.string().trim().min(1).max(2048),
    imageAlt: text(300).min(1),
  }),
  spotlight: z.object({
    title: text(120).min(1),
    body: text(600),
    ctaLabel: text(40).min(1),
    ctaHref: z.string().trim().regex(/^\/[\w\-/?=&.%]*$/, "Use an internal link starting with /"),
    image: z.string().trim().min(1).max(2048),
    imageAlt: text(300).min(1),
  }),
  contact: z.object({
    retailerName: text(120).min(1),
    address: text(300),
    phones: z.array(text(40).min(3)).max(6),
    email: z.union([z.email().max(200), z.literal("")]),
    hours: optionalText(200),
    facebook: optionalUrl,
    instagram: optionalUrl,
  }),
  footerNote: text(400),
});

export const contactFormSchema = z.object({
  name: text(100).min(2, "Please enter your name"),
  email: z.email("Please enter a valid email address").max(200),
  phone: optionalText(40),
  subject: text(150).min(2, "Please add a subject"),
  message: text(4000).min(10, "Please write a little more detail (10+ characters)"),
  // Honeypot: real visitors never fill this hidden field.
  company: z.string().max(0).optional(),
});

export const newsletterSchema = z.object({
  email: z.email("Please enter a valid email address").max(200),
  company: z.string().max(0).optional(),
});

export const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

/** Flattens Zod issues into { "field.path": "message" } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}

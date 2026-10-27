export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Wilson Sri Lanka";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "Genuine Wilson tennis rackets, balls, bags, shoes and basketballs available in Sri Lanka. Explore specifications and buy from a verified local retailer.";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialises JSON-LD safely for inline <script> tags. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Wilson Sri Lanka";
/**
 * Normalises a configured site address: adds https:// when the scheme was left off
 * (e.g. "wilsonsrilanka.lk") and drops the trailing slash. Falls back to localhost if unusable.
 */
export function normaliseSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return "http://localhost:3000";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    console.warn(`[config] NEXT_PUBLIC_SITE_URL "${value}" is not a valid address — using http://localhost:3000.`);
    return "http://localhost:3000";
  }
}

export const SITE_URL = normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_DESCRIPTION =
  "Genuine Wilson tennis rackets, balls, bags, shoes and accessories available in Sri Lanka. Explore specifications and buy from a verified local retailer.";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialises JSON-LD safely for inline <script> tags. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

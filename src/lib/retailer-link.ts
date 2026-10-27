// Builds the outbound "Buy from retailer" link. Pure — used on server and client.

/**
 * Returns the exact product URL at the retailer, deep-linked to a variant when the retailer
 * supports it (Shopify `?variant=`), with optional UTM tags. Returns null for anything that
 * is not a plain http(s) URL, so the button is hidden rather than pointing somewhere unsafe.
 */
export function buildPurchaseUrl(
  retailerUrl: string | undefined,
  opts: { variantId?: string; utmSource?: string } = {},
): string | null {
  if (!retailerUrl) return null;
  let url: URL;
  try {
    url = new URL(retailerUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (opts.variantId && /^\d{1,20}$/.test(opts.variantId)) url.searchParams.set("variant", opts.variantId);
  if (opts.utmSource) {
    url.searchParams.set("utm_source", opts.utmSource);
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "wilson_catalogue");
  }
  return url.toString();
}

export function retailerHostname(retailerUrl: string | undefined): string | null {
  try {
    return retailerUrl ? new URL(retailerUrl).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

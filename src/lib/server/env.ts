import "server-only";

// Central, validated access to server configuration. Nothing here is exposed to the
// browser; only NEXT_PUBLIC_SITE_URL is public by design.

function read(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

export const env = {
  siteUrl: (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: read("SUPABASE_URL"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseBucket: read("SUPABASE_STORAGE_BUCKET") ?? "product-images",
  adminEmail: read("ADMIN_EMAIL")?.toLowerCase(),
  adminPasswordHash: read("ADMIN_PASSWORD_HASH"),
  adminSessionSecret: read("ADMIN_SESSION_SECRET"),
  resendApiKey: read("RESEND_API_KEY"),
  resendFrom: read("RESEND_FROM"),
  contactTo: read("CONTACT_TO"),
  retailerName: read("LOCAL_RETAILER_NAME") ?? "United Sports",
  retailerUrl: (read("LOCAL_RETAILER_URL") ?? "https://www.unitedsports.lk").replace(/\/$/, ""),
  retailerUtm: read("RETAILER_UTM_SOURCE"),
  retailerOffersPage: read("RETAILER_OFFERS_PAGE") ?? "/pages/anniversary-offers",
  retailerOfferLabel: read("RETAILER_OFFER_LABEL") ?? "Anniversary Offer",
  localDataStore: read("LOCAL_DATA_STORE") === "true",
  // Serverless hosts have read-only/ephemeral filesystems: never use the file store there.
  onServerlessHost: !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
};

export const services = {
  supabase: !!(env.supabaseUrl && env.supabaseServiceRoleKey),
  adminAuth: !!(env.adminEmail && env.adminPasswordHash && (env.adminSessionSecret?.length ?? 0) >= 32),
  email: !!(env.resendApiKey && env.resendFrom && env.contactTo),
};

/** Retailer settings safe to hand to page components (no secrets). */
export function retailerConfig() {
  return { name: env.retailerName, url: env.retailerUrl, utmSource: env.retailerUtm };
}

let reported = false;
/** Logs missing optional services once per server process (called from instrumentation). */
export function reportConfiguration(): void {
  if (reported) return;
  reported = true;
  const notes: string[] = [];
  if (!services.supabase)
    notes.push(
      env.localDataStore && !env.onServerlessHost
        ? "Supabase not configured — using the LOCAL development file store (.data/)."
        : "Supabase not configured — catalogue is read-only (bundled seed data).",
    );
  if (!services.adminAuth)
    notes.push("Admin login disabled — set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET (32+ chars).");
  if (!services.email) notes.push("Email not configured — contact form will show direct contact details instead.");
  if (!process.env.NEXT_PUBLIC_SITE_URL) notes.push("NEXT_PUBLIC_SITE_URL not set — canonical URLs use http://localhost:3000.");
  for (const n of notes) console.warn(`[config] ${n}`);
}

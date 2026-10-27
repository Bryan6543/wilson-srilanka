import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Supabase Storage host (public product images) — only allowed when configured.
const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const imgSources = ["'self'", "data:", "blob:", "https://cdn.shopify.com", "https://www.wilson.com"];
if (supabaseHost) imgSources.push(`https://${supabaseHost}`);

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; dev mode additionally needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSources.join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    maximumRedirects: 0,
    remotePatterns: [
      // United Sports (verified local retailer) Shopify product media
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/1/0732/7583/4503/**" },
      // Official Wilson product media
      { protocol: "https", hostname: "www.wilson.com", pathname: "/cdn/shop/**" },
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/1/0996/7373/5482/**" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/brand/**" },
      { pathname: "/api/media/**" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;

import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Archivo is a variable font with a width axis, used as a stand-in for Wilson's licensed
// GT America family (Compressed for headlines, Standard for body, Extended for buttons).
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Tennis Rackets, Balls & Gear`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_LK",
    images: [{ url: "/images/campaign/racket-wall.webp", width: 1920, height: 540, alt: "Wilson tennis rackets" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-LK" className={archivo.variable}>
      <body className="min-h-dvh bg-surface text-ink">{children}</body>
    </html>
  );
}

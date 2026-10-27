import type { Metadata } from "next";
import { getSiteContent } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const { contact, footerNote } = await getSiteContent();
  return (
    <div className="container-site max-w-3xl pt-6">
      <Breadcrumbs items={[{ label: "Terms", href: "/terms" }]} />
      <h1 className="font-display mt-6 text-5xl md:text-6xl">Terms of use</h1>
      <div className="prose-wilson mt-8 text-ink-soft">
        <p>
          This website shows Wilson products available in Sri Lanka. It is operated by {contact.retailerName}. By using
          the site you agree to these terms.
        </p>
        <h2>Product information</h2>
        <p>
          Descriptions, specifications and images come from the retailer’s product listings and official Wilson sources.
          We work to keep them accurate, but errors can happen and specifications may change between model years.
        </p>
        <h2>Prices and availability</h2>
        <p>
          Prices are shown in Sri Lankan rupees as listed by the retailer, along with stock status. Both can change
          without notice. The price and availability shown on the retailer’s checkout are final.
        </p>
        <h2>Purchases</h2>
        <p>
          This site does not sell products directly. “Buy” buttons take you to the retailer’s online store, whose terms,
          returns and warranty policies apply to your purchase.
        </p>
        <h2>Trademarks</h2>
        <p>{footerNote}</p>
      </div>
    </div>
  );
}

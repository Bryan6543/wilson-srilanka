import type { Metadata } from "next";
import { shortBusinessName } from "@/lib/utils";
import Link from "next/link";
import { getOfferSummary, getSiteContent } from "@/lib/catalog";
import { parseProductQuery } from "@/lib/product-query";
import { CatalogView } from "@/components/product/CatalogView";
import { OffersBanner } from "@/components/home/OffersBanner";
import { EmptyState } from "@/components/ui/States";

export async function generateMetadata(): Promise<Metadata> {
  const summary = await getOfferSummary();
  return {
    title: summary ? `Wilson Offers — Up to ${summary.maxPercent}% Off` : "Wilson Offers",
    description: summary
      ? `${summary.count} Wilson products discounted by up to ${summary.maxPercent}% in Sri Lanka. See the discounted price on each product.`
      : "Current Wilson offers in Sri Lanka.",
    alternates: { canonical: "/offers" },
  };
}

export default async function OffersPage({ searchParams }: PageProps<"/offers">) {
  const params = await searchParams;
  const [summary, content] = await Promise.all([getOfferSummary(), getSiteContent()]);
  const retailer = shortBusinessName(content.contact.retailerName);
  const pct = parseProductQuery(params).offerPercent;

  if (!summary) {
    return (
      <div className="container-site pt-10">
        <h1 className="font-display text-5xl md:text-7xl">Offers</h1>
        <EmptyState
          title="No offers running right now"
          body="Check back soon, or browse the full Wilson range."
          action={{ label: "Browse products", href: "/products" }}
        />
      </div>
    );
  }

  return (
    <CatalogView
      basePath="/offers"
      params={params}
      fixedOffer
      banner={<OffersBanner summary={summary} retailerName={retailer} variant="page" activePercent={pct} />}
      title={pct ? `${pct}% off` : "All offers"}
      intro={
        <>
          Discounts as advertised by {retailer}
          {summary.label ? ` (${summary.label})` : ""}. The final price is confirmed at {retailer}’s checkout or in store.
          {pct && (
            <>
              {" "}
              <Link href="/offers" className="link-underline text-ink">
                Show all offers
              </Link>
            </>
          )}
        </>
      }
      crumbs={[{ label: "Offers", href: "/offers" }]}
    />
  );
}

import { getOfferSummary, getSiteContent } from "@/lib/catalog";
import { shortBusinessName } from "@/lib/utils";
import { storeStatus } from "@/lib/server/database";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header, buildNavSports } from "@/components/layout/Header";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [content, sports, offers] = await Promise.all([getSiteContent(), buildNavSports(), getOfferSummary()]);
  const retailerShortName = shortBusinessName(content.contact.retailerName);
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AnnouncementBar announcement={content.announcement} maxDiscount={offers?.maxPercent} />
      <Header retailerName={retailerShortName} />
      <main id="main">{children}</main>
      <Footer
        contact={content.contact}
        footerNote={content.footerNote}
        sports={sports}
        newsletterEnabled={storeStatus().writable}
      />
    </>
  );
}

import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteContent } from "@/lib/catalog";
import { services } from "@/lib/server/env";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact & Store",
  description: "Visit or contact the Wilson retailer in Colombo for product advice, stock and stringing questions.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { contact } = await getSiteContent();
  const mapQuery = encodeURIComponent(`${contact.retailerName}, ${contact.address}`);
  return (
    <div className="container-site pt-6">
      <Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />
      <h1 className="font-display mt-6 text-5xl md:text-7xl">Contact &amp; store</h1>
      <div className="mt-10 grid gap-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="visit-h">
          <h2 id="visit-h" className="font-extended text-xs">Visit the store</h2>
          <address className="mt-4 space-y-4 not-italic">
            <p className="text-xl font-bold">{contact.retailerName}</p>
            {contact.address && (
              <p className="flex gap-3">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0" />
                <span>
                  {contact.address}
                  <br />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-sm"
                  >
                    Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </span>
              </p>
            )}
            {contact.phones.map((p) => (
              <p key={p} className="flex gap-3">
                <Phone aria-hidden className="mt-0.5 size-5 shrink-0" />
                <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {p}
                </a>
              </p>
            ))}
            {contact.email && (
              <p className="flex gap-3">
                <Mail aria-hidden className="mt-0.5 size-5 shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </p>
            )}
            {contact.hours && <p className="text-sm text-muted">Opening hours: {contact.hours}</p>}
          </address>
          <p className="mt-8 text-sm text-muted">
            Orders, payment and delivery are handled by {contact.retailerName}. Use the “Buy” button on a product page to go
            straight to that item in the retailer’s online store.
          </p>
        </section>
        <section aria-labelledby="msg-h">
          <h2 id="msg-h" className="font-extended mb-6 text-xs">Send a message</h2>
          <ContactForm enabled={services.email} />
        </section>
      </div>
    </div>
  );
}

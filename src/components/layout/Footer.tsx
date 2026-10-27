import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { SiteContent } from "@/types/product";
import { Logo } from "@/components/ui/Logo";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import type { NavSport } from "./nav-types";

export function Footer({
  contact,
  footerNote,
  sports,
  newsletterEnabled,
}: {
  contact: SiteContent["contact"];
  footerNote: string;
  sports: NavSport[];
  newsletterEnabled: boolean;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark mt-24 bg-ink-strong text-white">
      {newsletterEnabled && (
        <div className="border-b border-white/15">
          <div className="container-site grid gap-6 py-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl">Stay in the game</h2>
              <p className="mt-2 text-sm text-white/70">New arrivals and restocks from Wilson in Sri Lanka. No spam.</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      )}
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <Logo inverted className="h-7" />
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Genuine Wilson equipment with prices in rupees, available in Sri Lanka through {contact.retailerName}.
          </p>
        </div>
        <nav aria-label="Shop by category">
          <h2 className="font-extended text-[11px] text-white/60">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {sports.flatMap((s) =>
              s.categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="hover:underline">
                    {c.name}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </nav>
        <nav aria-label="Information">
          <h2 className="font-extended text-[11px] text-white/60">Information</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/products" className="hover:underline">All products</Link></li>
            <li><Link href="/technologies" className="hover:underline">Technologies</Link></li>
            <li><Link href="/stories" className="hover:underline">Stories</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="font-extended text-[11px] text-white/60">Visit &amp; contact</h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="font-semibold">{contact.retailerName}</p>
            {contact.address && (
              <p className="flex gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                {contact.address}
              </p>
            )}
            {contact.phones.map((p) => (
              <p key={p} className="flex gap-2">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0" />
                <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {p}
                </a>
              </p>
            ))}
            {contact.email && (
              <p className="flex gap-2">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0" />
                <a href={`mailto:${contact.email}`} className="break-all hover:underline">
                  {contact.email}
                </a>
              </p>
            )}
          </address>
          {(contact.facebook || contact.instagram) && (
            <ul className="mt-4 flex gap-4 text-sm">
              {contact.facebook && (
                <li>
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Facebook<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
              {contact.instagram && (
                <li>
                  <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Instagram<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {contact.retailerName}. {footerNote}
          </p>
          <ul className="flex gap-4">
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

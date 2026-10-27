import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SafeImage } from "@/components/ui/SafeImage";

export const metadata: Metadata = {
  title: "About Wilson",
  description: "Wilson Sporting Goods: founded in Chicago in 1913. Find genuine Wilson equipment in Sri Lanka.",
  alternates: { canonical: "/about" },
};

const FACTS = [
  { value: "1913", label: "Founded in Chicago as the Ashland Manufacturing Company" },
  { value: "1941", label: "Official supplier of the NFL" },
  { value: "1979", label: "Wilson balls first used at the US Open" },
  { value: "2021", label: "Official game ball of the NBA and WNBA" },
];

export default async function AboutPage() {
  const { contact } = await getSiteContent();
  return (
    <>
      <div className="container-site pt-6">
        <Breadcrumbs items={[{ label: "About", href: "/about" }]} />
      </div>
      <section className="container-site mt-6 grid items-end gap-10 md:grid-cols-2">
        <div>
          <h1 className="font-display text-6xl md:text-8xl">About Wilson</h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            Wilson Sporting Goods began in Chicago in 1913, and the company is still based there. Since 1989 it has been part
            of Amer Sports. Wilson makes equipment for tennis, padel, pickleball, basketball, American football, baseball, golf
            and more.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
          <SafeImage
            src="/images/campaign/performance.webp"
            alt="A professional player holding a green Wilson Blade tennis racket"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section aria-labelledby="facts-h" className="container-site mt-20">
        <h2 id="facts-h" className="sr-only">
          Milestones
        </h2>
        <dl className="grid gap-px bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.value} className="bg-white p-6">
              <dt className="font-display text-6xl">{f.value}</dt>
              <dd className="mt-2 text-sm text-muted">{f.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">
          Source:{" "}
          <a href="https://en.wikipedia.org/wiki/Wilson_Sporting_Goods" className="underline" target="_blank" rel="noopener noreferrer">
            Wikipedia — Wilson Sporting Goods
          </a>
          . Brand information:{" "}
          <a href="https://www.wilson.com/en-us/pages/about-us" className="underline" target="_blank" rel="noopener noreferrer">
            wilson.com
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="lk-h" className="container-site mt-20 grid gap-10 border-t border-line-soft pt-14 md:grid-cols-2">
        <h2 id="lk-h" className="font-display text-5xl md:text-6xl">
          Wilson in Sri Lanka
        </h2>
        <div className="space-y-4 text-ink-soft">
          <p>
            This site is a catalogue of Wilson products available in Sri Lanka. Every product is backed by a real local
            retail listing, with prices in Sri Lankan rupees and stock taken from that listing.
          </p>
          <p>
            Products are sold by <strong>{contact.retailerName}</strong>, a racquet sports specialist in Colombo. When you
            choose “Buy”, you go straight to that exact product in the retailer’s online store, which handles checkout,
            payment and delivery.
          </p>
          <p>
            <Link href="/contact" className="link-underline font-semibold text-ink">
              Store location &amp; contact details
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

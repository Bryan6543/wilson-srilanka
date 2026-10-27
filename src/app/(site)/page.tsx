import Link from "next/link";
import { shortBusinessName } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { getCategories, getCategoriesWithCounts, getOfferSummary, getPublishedProducts, getSiteContent } from "@/lib/catalog";
import { savingPercent } from "@/lib/pricing";
import { pickHeroCollections } from "@/lib/promotions";
import { TECHNOLOGIES } from "@/data/technologies";
import { publishedStories } from "@/data/stories";
import { absoluteUrl, jsonLd, SITE_NAME } from "@/lib/seo";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryCard } from "@/components/home/CategoryCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import { primaryImage } from "@/lib/product-query";
import { SafeImage } from "@/components/ui/SafeImage";

const FAMILIES = [
  { tag: "blade", name: "Blade", line: "Feel and control" },
  { tag: "clash", name: "Clash", line: "Flexibility meets stability" },
  { tag: "pro-staff", name: "Pro Staff", line: "Precision, since the '80s" },
  { tag: "ultra", name: "Ultra", line: "Easy, explosive power" },
  { tag: "rf", name: "RF", line: "The signature RF line" },
];

export const revalidate = 300;

export default async function HomePage() {
  const [content, products, categories, categoryCounts, offerSummary] = await Promise.all([
    getSiteContent(),
    getPublishedProducts(),
    getCategories(),
    getCategoriesWithCounts(),
    getOfferSummary(),
  ]);
  const retailerShortName = shortBusinessName(content.contact.retailerName);
  // Biggest discounts first; in-stock items before sold-out ones.
  const topOffers = products
    .filter((p) => savingPercent(p) !== undefined)
    .sort(
      (a, b) =>
        Number(b.availability === "in_stock") - Number(a.availability === "in_stock") ||
        savingPercent(b)! - savingPercent(a)! ||
        Number(b.featured) - Number(a.featured),
    )
    .slice(0, 4);

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const recent = [...products]
    .filter((p) => !p.featured)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const families = FAMILIES.map((f) => {
    const items = products.filter((p) => p.tags.includes(f.tag) && p.category === "tennis-rackets");
    const hero = items.find((p) => p.featured) ?? items.find((p) => p.availability === "in_stock") ?? items[0];
    return { ...f, count: items.length, image: hero ? primaryImage(hero) : undefined };
  }).filter((f) => f.count > 0);
  const stories = publishedStories().slice(0, 2);

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgLd) }} />
      <HeroSection hero={content.hero} offers={offerSummary} saleBanner={content.saleBanner} collections={pickHeroCollections(products)} retailerName={retailerShortName} />

      {topOffers.length > 0 && (
        <section aria-labelledby="offers-h" className="container-site mt-16 md:mt-20">
          <SectionHeading id="offers-h" eyebrow="On offer now" title="Top offers" action={{ label: "All offers", href: "/offers" }} />
          <ProductGrid products={topOffers} categories={categories} priorityCount={0} />
        </section>
      )}

      {/* Shop by category */}
      <section aria-labelledby="cat-h" className="container-site mt-16 md:mt-20">
        <SectionHeading id="cat-h" eyebrow="Shop by category" title="Gear up" action={{ label: "All products", href: "/products" }} />
        <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {categoryCounts.map((c) => (
            <li key={c.slug} className="w-[42%] shrink-0 snap-start sm:w-auto">
              <CategoryCard href={`/category/${c.slug}`} name={c.name} count={c.count} image={c.image} />
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section aria-labelledby="feat-h" className="container-site mt-20 md:mt-28">
          <SectionHeading id="feat-h" eyebrow="Featured" title="Players’ picks" action={{ label: "Shop rackets", href: "/category/tennis-rackets" }} />
          <ProductGrid products={featured} categories={categories} priorityCount={0} />
        </section>
      )}

      {/* Racket families */}
      {families.length > 0 && (
        <section aria-labelledby="fam-h" className="mt-20 bg-surface-warm py-16 md:mt-28 md:py-20">
          <div className="container-site">
            <SectionHeading id="fam-h" eyebrow="Racket families" title="Find your frame" action={{ label: "Compare technologies", href: "/technologies" }} />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
              {families.map((f) => (
                <li key={f.tag}>
                  <Link href={`/products?category=tennis-rackets&tag=${f.tag}`} className="group block bg-white p-4 transition-shadow hover:shadow-md">
                    <div className="relative aspect-[4/5]">
                      <SafeImage src={f.image?.src} alt="" fill sizes="(min-width: 1024px) 18vw, 45vw" className="object-contain" />
                    </div>
                    <h3 className="font-display mt-3 text-3xl">{f.name}</h3>
                    <p className="mt-1 text-sm text-muted">{f.line}</p>
                    <p className="mt-3 flex items-center gap-1 text-xs font-semibold">
                      {f.count} {f.count === 1 ? "racket" : "rackets"}
                      <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Recently added */}
      {recent.length > 0 && (
        <section aria-labelledby="new-h" className="container-site mt-20 md:mt-28">
          <SectionHeading id="new-h" eyebrow="Just in" title="Recently added" action={{ label: "See all", href: "/products?sort=newest" }} />
          <ProductGrid products={recent} categories={categories} priorityCount={0} />
        </section>
      )}

      {/* Technology */}
      <section aria-labelledby="tech-h" className="on-dark mt-20 bg-ink-strong py-16 text-white md:mt-28 md:py-20">
        <div className="container-site">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="font-extended mb-2 text-[11px] text-white/60">Innovation</p>
              <h2 id="tech-h" className="font-display text-4xl md:text-6xl">
                Engineered by Wilson
              </h2>
            </div>
            <Link href="/technologies" className="link-underline shrink-0 text-sm font-semibold">
              All technologies
            </Link>
          </div>
          <ul className="grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {TECHNOLOGIES.slice(0, 4).map((t) => (
              <li key={t.slug} className="bg-ink-strong p-6">
                <p className="font-extended text-[10px] text-white/60">{t.family}</p>
                <h3 className="mt-2 text-xl font-bold">{t.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{t.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Spotlight (editable) */}
      <section aria-labelledby="spot-h" className="container-site mt-20 grid items-center gap-8 md:mt-28 md:grid-cols-2 md:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
          <SafeImage src={content.spotlight.image} alt={content.spotlight.imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 id="spot-h" className="font-display text-5xl md:text-7xl">
            {content.spotlight.title}
          </h2>
          <p className="mt-5 max-w-md text-base text-ink-soft md:text-lg">{content.spotlight.body}</p>
          <Link href={content.spotlight.ctaHref} className="btn btn-primary mt-8">
            {content.spotlight.ctaLabel}
          </Link>
        </div>
      </section>

      {/* Stories */}
      {stories.length > 0 && (
        <section aria-labelledby="stories-h" className="container-site mt-20 md:mt-28">
          <SectionHeading id="stories-h" eyebrow="Stories" title="The Wilson story" action={{ label: "All stories", href: "/stories" }} />
          <ul className="grid gap-8 md:grid-cols-2">
            {stories.map((s) => (
              <li key={s.slug}>
                <Link href={`/stories/${s.slug}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface-alt">
                    <SafeImage src={s.image} alt={s.imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold group-hover:underline">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

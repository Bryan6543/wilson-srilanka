import Link from "next/link";
import type { SiteContent } from "@/types/product";
import type { OfferSummary } from "@/lib/catalog";
import type { Product } from "@/types/product";
import type { HeroCollection, RacketFamilyTag } from "@/lib/promotions";
import { originalPrice, savingPercent, sellingPrice } from "@/lib/pricing";
import { primaryImage } from "@/lib/product-query";
import { cn, formatPrice } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";

const SALE_NAME = "Wilson Clearance Sale";

/** Panel colours taken from each racket family's frame finish. */
const FAMILY_PANEL: Record<RacketFamilyTag, string> = {
  "pro-staff": "bg-[#1f1a14]", // Pro Staff V14 black/bronze
  blade: "bg-[#0e3b2f]", // Blade V9 green
  clash: "bg-[#141414]", // Clash black
  ultra: "bg-[#12307a]", // Ultra blue
  rf: "bg-[#111111]", // RF black
};

/** Photo on the right half with a diagonal edge, over a solid brand-colour panel. */
function SplitMedia({
  image,
  alt,
  panel,
  mobileOverlay = "from-black/85 via-black/50 to-black/10",
  priority,
}: {
  image: string;
  alt: string;
  panel: string;
  mobileOverlay?: string;
  priority?: boolean;
}) {
  return (
    <div className={`absolute inset-0 ${panel}`}>
      <div className="absolute inset-y-0 right-0 w-full md:w-[55%] md:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]">
        <SafeImage
          src={image}
          alt={alt}
          fill
          priority={priority}
          quality={85}
          sizes="(min-width: 768px) 55vw, 100vw"
          className="object-cover object-[60%_30%]"
        />
        {/* Mobile: the photo sits behind the copy, so tint it for legibility. */}
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-t ${mobileOverlay} md:hidden`} />
      </div>
    </div>
  );
}

/** Slide 1: the overall sale message. Its headline is the page's h1. */
function SaleSlideContent({ offers, retailerName }: { offers: OfferSummary; retailerName: string }) {
  return (
    <div className="max-w-xl md:max-w-[46%]">
      <p data-reveal className="font-extended inline-block bg-white px-2.5 py-1.5 text-[11px] text-accent">
        {SALE_NAME}
      </p>
      <h1 data-reveal className="font-display mt-4 text-6xl sm:text-7xl xl:text-8xl">
        Wilson <span className="block">Up to {offers.maxPercent}% off</span>
      </h1>
      <p data-reveal className="mt-4 max-w-md text-base text-white/90 md:text-lg">
        {offers.count} Wilson rackets, bags, shoes and more are reduced at {retailerName}.
      </p>
      <ul data-reveal className="mt-6 flex flex-wrap gap-2" aria-label="Discount levels">
        {offers.tiers.map((t) => (
          <li key={t.percent}>
            <Link
              href={`/offers?pct=${t.percent}`}
              className="font-display block border border-white/70 px-3 py-1.5 text-2xl transition-colors hover:bg-white hover:text-accent"
            >
              {t.percent}%<span className="sr-only"> off: {t.count} products</span>
            </Link>
          </li>
        ))}
      </ul>
      <div data-reveal className="mt-7 flex flex-wrap gap-3">
        <Link href="/offers" className="btn btn-light">
          Shop the sale
        </Link>
        <Link href="/offers?category=tennis-rackets" className="btn border border-white text-white hover:bg-white/10">
          Racket deals
        </Link>
      </div>
    </div>
  );
}

const bannerName = (name: string) => name.replace(/\s*\btennis racket\b\s*/i, " ").replace(/\s+/g, " ").trim();

/** Collection banner background: family-colour panel with a light diagonal stage (desktop). */
function CollectionMedia({ collection }: { collection: HeroCollection }) {
  return (
    <div className={`absolute inset-0 ${FAMILY_PANEL[collection.family.tag]}`}>
      <div className="absolute inset-y-0 right-0 hidden w-[58%] bg-surface-warm [clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)] md:block" />
      <div
        aria-hidden
        className="font-display pointer-events-none absolute bottom-[-2rem] left-4 hidden select-none text-[11rem] leading-none text-white/[0.06] md:block xl:text-[14rem]"
      >
        {collection.family.name}
      </div>
    </div>
  );
}

/** One racket in the line-up: photo, % badge, name and prices, linking to the product. */
function RacketCard({ product, index }: { product: Product; index: number }) {
  const img = primaryImage(product);
  const now = sellingPrice(product)!;
  const was = originalPrice(product);
  const pct = savingPercent(product);
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-md bg-white text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-1.5 sm:w-40 md:w-auto",
        index % 2 === 1 && "md:mt-10",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-white">
        <SafeImage
          src={img?.src}
          alt={img?.alt ?? `Wilson ${product.name}`}
          fill
          sizes="(min-width: 1280px) 14vw, (min-width: 768px) 13vw, 160px"
          className="scale-[1.18] object-cover object-[50%_45%] transition-transform duration-500 group-hover:scale-[1.26]"
        />
        {pct !== undefined && (
          <span className="font-display absolute left-2 top-2 bg-accent px-2 py-1 text-lg leading-none text-white">
            -{pct}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line-soft p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug">{bannerName(product.name)}</p>
        <p className="mt-auto text-sm font-bold text-accent">{formatPrice(now, product.currency)}</p>
        {was !== undefined && <s className="text-[11px] text-muted">{formatPrice(was, product.currency)}</s>}
      </div>
    </Link>
  );
}

function CollectionContent({ collection, retailerName }: { collection: HeroCollection; retailerName: string }) {
  const { family, products, total, maxPercent } = collection;
  const from = Math.min(...products.map((p) => sellingPrice(p)!));
  return (
    <div className="flex min-w-0 flex-col gap-6 md:grid md:grid-cols-[minmax(0,38%)_minmax(0,1fr)] md:items-center md:gap-8">
      <div className="min-w-0 md:pr-4">
        <p data-reveal className="font-extended inline-block bg-accent px-2.5 py-1.5 text-[11px] text-white">
          Clearance sale · up to {maxPercent}% off
        </p>
        <h2 data-reveal className="font-display mt-4 text-6xl sm:text-7xl xl:text-8xl">
          {family.name}
          <span className="block text-4xl text-white/85 sm:text-5xl xl:text-6xl">rackets</span>
        </h2>
        <p data-reveal className="mt-4 text-base text-white/90 md:text-lg">
          {total} {family.name} {total === 1 ? "racket" : "rackets"} on sale and in stock at {retailerName}, from{" "}
          <strong className="whitespace-nowrap">{formatPrice(from, products[0]?.currency)}</strong>.
        </p>
        <div data-reveal className="mt-7 flex flex-wrap gap-3">
          <Link href={`/offers?category=tennis-rackets&tag=${family.tag}`} className="btn btn-light">
            Shop {family.name} deals
          </Link>
          <Link href="/offers?category=tennis-rackets" className="btn border border-white text-white hover:bg-white/10">
            All racket deals
          </Link>
        </div>
      </div>
      <ul
        data-reveal
        aria-label={`${family.name} rackets on sale`}
        className="scrollbar-none -mx-4 order-first flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:order-none md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-10 md:pl-[6%]"
      >
        {products.map((p, i) => (
          <li key={p.id} className="md:min-w-0">
            <RacketCard product={p} index={i} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MainSlideContent({ hero }: { hero: SiteContent["hero"] }) {
  return (
    <div className="max-w-xl">
      {hero.eyebrow && (
        <p data-reveal className="font-extended text-xs text-white/80">
          {hero.eyebrow}
        </p>
      )}
      <h1 data-reveal className="font-display mt-3 text-6xl sm:text-7xl xl:text-8xl">
        {hero.title}
      </h1>
      {hero.subtitle && (
        <p data-reveal className="mt-5 max-w-md text-base text-white/85 md:text-lg">
          {hero.subtitle}
        </p>
      )}
      <div data-reveal className="mt-8 flex flex-wrap gap-3">
        <Link href={hero.ctaHref} className="btn btn-light">
          {hero.ctaLabel}
        </Link>
        <Link href="/products" className="btn border border-white text-white hover:bg-white/10">
          View all products
        </Link>
      </div>
    </div>
  );
}

/**
 * Homepage hero carousel. While a sale is running: the sale banner followed by one banner per
 * racket family showing several of its discounted, in-stock rackets at the retailer. With no sale running it falls
 * back to the editable main banner (Admin → Site content).
 */
export function HeroSection({
  hero,
  offers,
  saleBanner,
  collections,
  retailerName,
}: {
  hero: SiteContent["hero"];
  saleBanner: SiteContent["saleBanner"];
  offers: OfferSummary | null;
  collections: HeroCollection[];
  retailerName: string;
}) {
  const slides: HeroSlide[] = [];

  if (offers) {
    slides.push({
      id: "sale",
      label: `${SALE_NAME}: up to ${offers.maxPercent}% off`,
      media: (
        <>
          <SplitMedia
            image={saleBanner.image}
            alt={saleBanner.imageAlt}
            panel="bg-accent"
            mobileOverlay="from-accent via-accent/80 to-accent/10"
            priority
          />
          <div
            aria-hidden
            className="font-display pointer-events-none absolute -bottom-10 left-[30%] hidden select-none text-[20rem] leading-none text-white/10 md:block"
          >
            %
          </div>
        </>
      ),
      content: <SaleSlideContent offers={offers} retailerName={retailerName} />,
    });

    for (const collection of collections) {
      slides.push({
        id: `family-${collection.family.tag}`,
        label: `${collection.family.name} rackets: up to ${collection.maxPercent}% off`,
        media: <CollectionMedia collection={collection} />,
        content: <CollectionContent collection={collection} retailerName={retailerName} />,
      });
    }
  } else {
    slides.push({
      id: "main",
      label: hero.title,
      media: (
        <>
          <SafeImage
            src={hero.image}
            alt={hero.imageAlt}
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover object-[70%_50%] md:object-center"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/0" />
        </>
      ),
      content: <MainSlideContent hero={hero} />,
    });
  }

  return <HeroCarousel slides={slides} />;
}

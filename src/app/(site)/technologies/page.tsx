import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TECHNOLOGIES } from "@/data/technologies";
import { getPublishedProducts } from "@/lib/catalog";
import { tagLabel } from "@/components/product/CatalogView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Racket & Footwear Technologies",
  description: "How Wilson's racket and footwear technologies work: X-Loop, SI3D, FORTYFIVE°, Paradigm Bending and more.",
  alternates: { canonical: "/technologies" },
};

export default async function TechnologiesPage() {
  const products = await getPublishedProducts();
  return (
    <div className="container-site pt-6">
      <Breadcrumbs items={[{ label: "Technologies", href: "/technologies" }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="font-display text-5xl md:text-7xl">Technologies</h1>
        <p className="mt-4 text-lg text-ink-soft">
          The engineering behind Wilson’s racket families and court shoes. Each description is summarised from Wilson’s
          official product information, with a link to the source.
        </p>
      </header>
      <ul className="mt-12 grid gap-px bg-line-soft md:grid-cols-2">
        {TECHNOLOGIES.map((t) => {
          const count = t.relatedTag ? products.filter((p) => p.tags.includes(t.relatedTag!)).length : 0;
          return (
            <li key={t.slug} id={t.slug} className="flex flex-col bg-white p-6 md:p-8">
              <p className="font-extended text-[10px] text-muted">{t.family}</p>
              <h2 className="mt-2 text-2xl font-bold">{t.name}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{t.summary}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted underline">
                  Source: {t.sourceName}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                {count > 0 && (
                  <Link href={`/products?tag=${t.relatedTag}`} className="group flex items-center gap-1 font-semibold">
                    <span className="link-underline">
                      Shop {tagLabel(t.relatedTag!)} ({count})
                    </span>
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-muted">
        Not every technology appears in every model or generation. Check each product’s specifications.
      </p>
    </div>
  );
}

import { Suspense } from "react";
import { getCategories, getPublishedProducts } from "@/lib/catalog";
import { savingPercent } from "@/lib/pricing";
import { parseProductQuery, priceBounds, queryProducts } from "@/lib/product-query";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/States";
import { CatalogToolbar, ProductFilters, type FilterConfig } from "./ProductFilters";
import { Pagination } from "./Pagination";
import { ProductGrid } from "./ProductGrid";

type Params = Record<string, string | string[] | undefined>;

const TAG_LABELS: Record<string, string> = {
  "pro-staff": "Pro Staff",
  rf: "RF",
  "us-open": "US Open",
  "roland-garros": "Roland Garros",
  "rush-pro": "Rush Pro",
  "super-tour": "Super Tour",
};

export const tagLabel = (t: string) =>
  TAG_LABELS[t] ?? t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export async function CatalogView({
  basePath,
  params,
  fixedCategory,
  fixedOffer = false,
  banner,
  title,
  intro,
  crumbs,
}: {
  basePath: string;
  params: Params;
  fixedCategory?: string;
  /** Restrict to products with an active offer (the /offers page). */
  fixedOffer?: boolean;
  /** Optional full-width block rendered above the title. */
  banner?: React.ReactNode;
  title: string;
  intro?: React.ReactNode;
  crumbs: Crumb[];
}) {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  const query = parseProductQuery(params);
  if (fixedCategory) query.category = [fixedCategory];
  if (fixedOffer) query.onOffer = true;

  // Filter options are computed from the products in scope (category page or whole catalogue).
  const scope = products.filter(
    (p) => (!fixedCategory || p.category === fixedCategory) && (!fixedOffer || savingPercent(p) !== undefined),
  );
  const tagCounts = new Map<string, number>();
  for (const p of scope) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const config: FilterConfig = {
    categories: fixedCategory
      ? undefined
      : categories
          .map((c) => ({ value: c.slug, label: c.name, count: scope.filter((p) => p.category === c.slug).length }))
          .filter((c) => c.count > 0),
    tags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, label: tagLabel(value), count })),
    priceBounds: priceBounds(scope),
    hideOfferFilter: fixedOffer,
  };

  const result = queryProducts(products, query);

  return (
    <div className="container-site pt-6">
      <Breadcrumbs items={crumbs} />
      {banner}
      <header className="mt-6 max-w-3xl">
        <h1 className="font-display text-5xl md:text-7xl">{title}</h1>
        {intro && <div className="mt-3 text-base text-ink-soft">{intro}</div>}
      </header>
      <div className="mt-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <Suspense fallback={<div className="hidden lg:block" />}>
          <ProductFilters config={config} />
        </Suspense>
        <div>
          <Suspense fallback={<div className="mb-6 h-9" />}>
            <CatalogToolbar total={result.total} config={config} />
          </Suspense>
          {result.items.length ? (
            <ProductGrid products={result.items} categories={categories} />
          ) : (
            <EmptyState
              title="No products match"
              body={query.q ? `Nothing matched “${query.q}” with the current filters.` : "Try removing a filter or widening the price range."}
              action={{ label: "Clear filters", href: basePath }}
            />
          )}
          <Pagination basePath={basePath} params={params} page={result.page} pageCount={result.pageCount} />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Search } from "lucide-react";
import { CatalogView } from "@/components/product/CatalogView";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  const term = Array.isArray(q) ? q[0] : q;
  return {
    title: term ? `Search: ${term.slice(0, 60)}` : "Search",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  return (
    <>
      <div className="container-site pt-8">
        <form role="search" action="/search" className="flex max-w-2xl items-center gap-3 border-b-2 border-ink">
          <Search aria-hidden className="size-5 shrink-0" />
          <label htmlFor="search-page-q" className="sr-only">
            Search products
          </label>
          <input
            id="search-page-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search rackets, balls, bags…"
            className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-muted"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>
      <CatalogView
        basePath="/search"
        params={params}
        title={q ? `Results for “${q.slice(0, 60)}”` : "Search"}
        crumbs={[{ label: "Search", href: "/search" }]}
      />
    </>
  );
}

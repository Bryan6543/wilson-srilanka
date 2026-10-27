import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import type { Product } from "@/types/product";
import { getStore, storeStatus } from "@/lib/server/database";
import { catalogueHealth } from "@/lib/server/products";
import { services } from "@/lib/server/env";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-md bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {body}
    </Link>
  ) : (
    <div className="rounded-md bg-white p-5 shadow-sm">{body}</div>
  );
}

function IssueList({ title, products, hint }: { title: string; products: Product[]; hint: string }) {
  if (!products.length) return null;
  return (
    <section className="rounded-md bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold">
        <AlertTriangle aria-hidden className="size-4 text-warning" /> {title} ({products.length})
      </h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <ul className="mt-3 divide-y divide-line-soft text-sm">
        {products.slice(0, 8).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-2">
            <span className="truncate">{p.name}</span>
            <Link href={`/admin/products/${p.id}`} className="shrink-0 underline">
              Fix
            </Link>
          </li>
        ))}
      </ul>
      {products.length > 8 && <p className="mt-2 text-xs text-muted">…and {products.length - 8} more</p>}
    </section>
  );
}

export default async function DashboardPage() {
  const products = await getStore().listProducts();
  const h = catalogueHealth(products);
  const store = storeStatus();
  const recent = [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">
          <Plus aria-hidden className="size-4" /> Add product
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Total products" value={h.total} href="/admin/products" />
        <Stat label="Published" value={h.published} href="/admin/products?status=published" />
        <Stat label="Drafts" value={h.drafts} href="/admin/products?status=draft" />
        <Stat label="Featured" value={h.featured} href="/admin/products?status=featured" />
        <Stat label="On offer (live)" value={h.onOffer} href="/admin/products?status=offer" />
        <Stat label="Out of stock" value={h.outOfStock} href="/admin/products?status=out_of_stock" />
        <Stat label="Incomplete" value={h.incomplete.length} href="/admin/products?status=incomplete" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IssueList title="Needs review before publishing" products={h.needsReview} hint="Imported listings with a data problem (see the notes on each product)." />
        <IssueList title="Missing images" products={h.missingImages} hint="Products need at least one image to be published." />
        <IssueList title="Missing source information" products={h.missingSource} hint="Record where the product information came from." />
        <IssueList
          title="Incomplete data"
          products={h.incomplete}
          hint="Missing a description, price, specifications or retailer link."
        />
      </div>

      <section className="rounded-md bg-white p-5 shadow-sm">
        <h2 className="font-bold">Recently updated</h2>
        <ul className="mt-3 divide-y divide-line-soft text-sm">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-2">
              <Link href={`/admin/products/${p.id}`} className="truncate hover:underline">
                {p.name}
              </Link>
              <span className="shrink-0 text-muted">{new Date(p.updatedAt).toLocaleDateString("en-LK")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md bg-white p-5 text-sm shadow-sm">
        <h2 className="font-bold">System status</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-muted">Storage</dt>
            <dd>{store.kind === "supabase" ? "Supabase (live)" : store.kind === "local" ? "Local dev file store" : "Read-only seed data"}</dd>
          </div>
          <div>
            <dt className="text-muted">Contact form email</dt>
            <dd>{services.email ? "Configured" : "Not configured"}</dd>
          </div>
          <div>
            <dt className="text-muted">Newsletter</dt>
            <dd>{store.writable ? "Collecting sign-ups" : "Disabled (no storage)"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

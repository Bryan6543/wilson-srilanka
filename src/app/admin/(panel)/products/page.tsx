import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getStore } from "@/lib/server/database";
import { catalogueHealth } from "@/lib/server/products";
import { scoreProduct } from "@/lib/product-query";
import { AdminProductTable } from "@/components/admin/AdminProductTable";

export const metadata: Metadata = { title: "Products" };

const STATUS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "featured", label: "Featured" },
  { value: "offer", label: "On offer" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "incomplete", label: "Incomplete" },
];

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim();
  const status = one(sp.status);
  const category = one(sp.category);

  const store = getStore();
  const [all, categories] = await Promise.all([store.listProducts(), store.listCategories()]);
  const incomplete = new Set(catalogueHealth(all).incomplete.map((p) => p.id));

  let rows = all;
  if (q) rows = rows.filter((p) => scoreProduct(p, q) > 0 || p.id === q || p.productCode?.toLowerCase() === q.toLowerCase());
  if (category) rows = rows.filter((p) => p.category === category);
  if (status === "published") rows = rows.filter((p) => p.published);
  if (status === "draft") rows = rows.filter((p) => !p.published);
  if (status === "featured") rows = rows.filter((p) => p.featured);
  if (status === "offer") rows = rows.filter((p) => !!p.discountPercent);
  if (status === "out_of_stock") rows = rows.filter((p) => p.availability === "out_of_stock");
  if (status === "incomplete") rows = rows.filter((p) => incomplete.has(p.id));
  rows = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">
          <Plus aria-hidden className="size-4" /> Add product
        </Link>
      </div>

      <form role="search" className="mt-6 flex flex-wrap items-end gap-3 rounded-md bg-white p-4 shadow-sm">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="field-label">
            Search
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, model or product code" className="field-input" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="field-input">
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="field-label">
            Category
          </label>
          <select id="category" name="category" defaultValue={category} className="field-input">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Filter
        </button>
        {(q || status || category) && (
          <Link href="/admin/products" className="btn btn-secondary">
            Reset
          </Link>
        )}
      </form>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        Showing {rows.length} of {all.length} products
      </p>
      <AdminProductTable
        products={rows}
        categories={Object.fromEntries(categories.map((c) => [c.slug, c.name]))}
        incompleteIds={[...incomplete]}
      />
    </div>
  );
}

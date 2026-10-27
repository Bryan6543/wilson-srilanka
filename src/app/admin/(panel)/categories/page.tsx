import type { Metadata } from "next";
import { getStore } from "@/lib/server/database";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const store = getStore();
  const [categories, products] = await Promise.all([store.listCategories(), store.listProducts()]);
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          Categories appear in the menu and on the homepage only when they are visible and contain published products.
        </p>
      </div>
      {sorted.map((c) => (
        <CategoryForm
          key={`${c.slug}-${c.name}-${c.sortOrder}-${c.visible}`}
          category={c}
          productCount={products.filter((p) => p.category === c.slug).length}
          canSave={store.writable}
        />
      ))}
      <CategoryForm category={null} productCount={0} canSave={store.writable} />
    </div>
  );
}

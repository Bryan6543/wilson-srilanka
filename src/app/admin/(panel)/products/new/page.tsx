import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/server/database";
import { env } from "@/lib/server/env";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const store = getStore();
  const categories = await store.listCategories();
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/products" className="text-sm underline">
        ← Products
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Add product</h1>
      <ProductEditor product={null} categories={categories} canSave={store.writable} retailerName={env.retailerName} />
    </div>
  );
}

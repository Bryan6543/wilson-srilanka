import type { Metadata } from "next";
import { getStore } from "@/lib/server/database";
import { SiteContentEditor } from "@/components/admin/SiteContentEditor";

export const metadata: Metadata = { title: "Site content" };

export default async function ContentPage() {
  const store = getStore();
  const content = await store.getSiteContent();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Site content</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Homepage banner, announcement bar, contact details and footer text. Featured products are chosen on each product
        (Products → ★).
      </p>
      <SiteContentEditor content={content} canSave={store.writable} />
    </div>
  );
}

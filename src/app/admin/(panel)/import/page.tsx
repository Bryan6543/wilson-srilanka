import type { Metadata } from "next";
import { Download, FileDown } from "lucide-react";
import { storeStatus } from "@/lib/server/database";
import { env } from "@/lib/server/env";
import { CsvImporter, RetailerSync } from "@/components/admin/ImportTools";

export const metadata: Metadata = { title: "Import / export" };

export default function ImportPage() {
  const { writable } = storeStatus();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Import / export</h1>

      <section className="rounded-md bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Export</h2>
        <p className="mt-1 text-sm text-muted">
          Download every product (including drafts) as a spreadsheet. Edit it in Excel or Google Sheets and import it back
          to update products in bulk.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/api/admin/export" className="btn btn-primary btn-sm">
            <Download aria-hidden className="size-4" /> Export all products (CSV)
          </a>
          <a href="/api/admin/export?template=1" className="btn btn-secondary btn-sm">
            <FileDown aria-hidden className="size-4" /> Blank import template
          </a>
        </div>
      </section>

      <section className="rounded-md bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Import from CSV</h2>
        <div className="mt-1 space-y-2 text-sm text-muted">
          <p>
            Rows are matched to existing products by <code>id</code>, then <code>external_id</code>, then <code>slug</code>,
            then <code>retailer_url</code>. Matching rows are updated; everything else is added as a new product.
          </p>
          <p>
            Required columns: <code>name</code>, <code>category</code>, <code>description</code>. Separate list values
            (features, image URLs, specifications) with <code>|</code>, and write specifications as <code>Label: Value</code>.
            Set <code>published</code> to <code>yes</code> to publish.
          </p>
          <p>Every row is checked first. If any row has a problem, nothing is saved and each problem is listed.</p>
        </div>
        <div className="mt-5">
          <CsvImporter disabled={!writable} />
        </div>
      </section>

      <section className="rounded-md bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Sync from {env.retailerName}</h2>
        <p className="mt-1 text-sm text-muted">
          Reads the public product feed at <code>{env.retailerUrl}</code> and refreshes <strong>price, stock, variant links
          and retailer URLs</strong> for products imported from it. Your edits to names, descriptions and images are kept.
          New Wilson listings are added as <strong>drafts</strong> for you to review.
        </p>
        <div className="mt-5">
          <RetailerSync disabled={!writable} />
        </div>
      </section>
    </div>
  );
}

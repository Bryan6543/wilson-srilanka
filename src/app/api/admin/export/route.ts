import { assertAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/database";
import { PRODUCT_CSV_COLUMNS, productsToCsv, toCsv } from "@/lib/csv";

/** CSV export of the full catalogue (including drafts), or an empty template with ?template=1. */
export async function GET(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const template = new URL(req.url).searchParams.get("template") === "1";
  const csv = template ? toCsv([[...PRODUCT_CSV_COLUMNS]]) : productsToCsv(await getStore().listProducts());
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template ? "product-import-template" : `wilson-products-${date}`}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Eye, Pencil, Star, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { deleteProductAction, duplicateProductAction, setProductFlagsAction } from "@/app/actions/admin";
import { primaryImage } from "@/lib/product-query";
import { originalPrice, savingPercent, sellingPrice } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SafeImage } from "@/components/ui/SafeImage";
import { Notice } from "@/components/ui/States";

export function AdminProductTable({
  products,
  categories,
  incompleteIds,
}: {
  products: Product[];
  categories: Record<string, string>;
  incompleteIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const incomplete = new Set(incompleteIds);

  const run = (id: string, fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setFeedback(res.ok ? (res.message ? { tone: "success", text: res.message } : null) : { tone: "error", text: res.error ?? "Failed" });
      setBusyId(null);
      router.refresh();
    });
  };

  if (!products.length) {
    return <p className="mt-6 rounded-md bg-white p-8 text-center text-muted shadow-sm">No products match these filters.</p>;
  }

  return (
    <>
      {feedback && (
        <div className="mt-4">
          <Notice tone={feedback.tone}>{feedback.text}</Notice>
        </div>
      )}
      <div className="mt-4 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <caption className="sr-only">Products</caption>
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="w-16 px-4 py-3">
                <span className="sr-only">Image</span>
              </th>
              <th scope="col" className="px-4 py-3">Product</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Featured</th>
              <th scope="col" className="px-4 py-3">Updated</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {products.map((p) => {
              const img = primaryImage(p);
              const busy = pending && busyId === p.id;
              return (
                <tr key={p.id} className={cn(busy && "opacity-50")}>
                  <td className="px-4 py-2">
                    <div className="relative size-12 bg-surface-warm">
                      <SafeImage src={img?.src} alt="" fill sizes="48px" className="object-contain mix-blend-multiply" />
                    </div>
                  </td>
                  <td className="max-w-72 px-4 py-2">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {[p.model, p.productCode].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {incomplete.has(p.id) && <span className="text-xs text-warning">Incomplete</span>}
                  </td>
                  <td className="px-4 py-2">{categories[p.category] ?? p.category}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {p.price !== undefined ? formatPrice(sellingPrice(p)!, p.currency) : <span className="text-muted">—</span>}
                    {savingPercent(p) !== undefined && (
                      <span className="block text-xs text-accent">
                        −{savingPercent(p)}% <s className="text-muted">{formatPrice(originalPrice(p)!, p.currency)}</s>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(p.id, () => setProductFlagsAction(p.id, { published: !p.published }))}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        p.published ? "bg-success-bg text-success" : "bg-surface-alt text-muted",
                      )}
                      title={p.published ? "Click to unpublish" : "Click to publish"}
                    >
                      {p.published ? "Published" : "Draft"}
                      <span className="sr-only">{p.published ? " — unpublish" : " — publish"} {p.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={p.featured}
                      aria-label={`${p.featured ? "Unfeature" : "Feature"} ${p.name}`}
                      onClick={() => run(p.id, () => setProductFlagsAction(p.id, { featured: !p.featured }))}
                      className="p-1"
                    >
                      <Star aria-hidden className={cn("size-4", p.featured ? "fill-ink text-ink" : "text-line")} />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-muted">{new Date(p.updatedAt).toLocaleDateString("en-LK")}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`} className="p-2 hover:bg-surface-alt" aria-label={`Edit ${p.name}`} title="Edit">
                        <Pencil aria-hidden className="size-4" />
                      </Link>
                      <Link
                        href={`/admin/products/${p.id}/preview`}
                        className="p-2 hover:bg-surface-alt"
                        aria-label={`Preview ${p.name}`}
                        title="Preview"
                      >
                        <Eye aria-hidden className="size-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(p.id, () => duplicateProductAction(p.id))}
                        className="p-2 hover:bg-surface-alt"
                        aria-label={`Duplicate ${p.name}`}
                        title="Duplicate"
                      >
                        <Copy aria-hidden className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setToDelete(p)}
                        className="p-2 text-error hover:bg-error-bg"
                        aria-label={`Delete ${p.name}`}
                        title="Delete"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title={`Delete “${toDelete?.name ?? ""}”?`}
        body="The product will be removed from the website permanently. Consider unpublishing it instead if you might need it later."
        confirmLabel="Delete product"
        busy={pending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const p = toDelete!;
          setToDelete(null);
          run(p.id, () => deleteProductAction(p.id));
        }}
      />
    </>
  );
}

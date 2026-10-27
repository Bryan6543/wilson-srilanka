"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category } from "@/types/product";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";
import { slugify } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notice } from "@/components/ui/States";

export function CategoryForm({
  category,
  productCount,
  canSave,
}: {
  category: Category | null;
  productCount: number;
  canSave: boolean;
}) {
  const router = useRouter();
  const isNew = !category;
  const [c, setC] = useState<Category>(
    category ?? { slug: "", name: "", sport: "tennis", description: "", image: "", sortOrder: 100, visible: true },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const id = category?.slug ?? "new";

  const save = () =>
    startTransition(async () => {
      const res = await saveCategoryAction({ ...c, slug: c.slug || slugify(c.name), image: c.image || undefined });
      if (res.ok) {
        setErrors({});
        setMsg({ tone: "success", text: res.message ?? "Saved." });
        if (isNew) setC({ slug: "", name: "", sport: "tennis", description: "", image: "", sortOrder: 100, visible: true });
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        setMsg({ tone: "error", text: res.error });
      }
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="rounded-md bg-white p-5 shadow-sm"
      aria-labelledby={`cat-${id}-h`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`cat-${id}-h`} className="font-bold">
          {isNew ? "Add a category" : category.name}
        </h2>
        {!isNew && <span className="text-sm text-muted">{productCount} products</span>}
      </div>
      {msg && (
        <div className="mt-3">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="field-label">Name</label>
          <input
            id={`${id}-name`}
            className="field-input"
            value={c.name}
            onChange={(e) => setC({ ...c, name: e.target.value, slug: isNew ? slugify(e.target.value) : c.slug })}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-slug`} className="field-label">URL slug</label>
          <input
            id={`${id}-slug`}
            className="field-input font-mono text-sm"
            value={c.slug}
            readOnly={!isNew}
            onChange={(e) => setC({ ...c, slug: slugify(e.target.value) })}
            aria-invalid={!!errors.slug}
            aria-describedby={`${id}-slug-hint`}
          />
          <p id={`${id}-slug-hint`} className="field-hint">
            {isNew ? `/category/${c.slug || "…"}` : "Slugs can’t be changed after creation, so existing links keep working."}
          </p>
          {errors.slug && <p className="field-error">{errors.slug}</p>}
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-desc`} className="field-label">Description</label>
          <textarea id={`${id}-desc`} rows={2} className="field-input" value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-sport`} className="field-label">Sport</label>
          <select id={`${id}-sport`} className="field-input" value={c.sport ?? ""} onChange={(e) => setC({ ...c, sport: e.target.value })}>
            <option value="tennis">Tennis</option>
            <option value="basketball">Basketball</option>
            <option value="padel">Padel</option>
            <option value="pickleball">Pickleball</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-order`} className="field-label">Sort order</label>
          <input
            id={`${id}-order`}
            type="number"
            min={0}
            max={999}
            className="field-input"
            value={c.sortOrder}
            onChange={(e) => setC({ ...c, sortOrder: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-img`} className="field-label">Image path or URL</label>
          <input
            id={`${id}-img`}
            className="field-input"
            value={c.image ?? ""}
            onChange={(e) => setC({ ...c, image: e.target.value })}
            placeholder="/images/categories/…"
            aria-invalid={!!errors.image}
          />
          {errors.image && <p className="field-error">{errors.image}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-ink" checked={c.visible} onChange={(e) => setC({ ...c, visible: e.target.checked })} />
          Visible on the website
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !canSave}>
          {pending ? "Saving…" : isNew ? "Add category" : "Save"}
        </button>
        {!isNew && (
          <button type="button" className="btn btn-secondary btn-sm text-error" disabled={pending || !canSave} onClick={() => setConfirm(true)}>
            Delete
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        title={`Delete “${category?.name ?? ""}”?`}
        body={productCount ? `This category has ${productCount} product(s). Move them to another category first.` : "This cannot be undone."}
        confirmLabel="Delete category"
        busy={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deleteCategoryAction(category!.slug);
            setConfirm(false);
            setMsg(res.ok ? { tone: "success", text: res.message ?? "Deleted." } : { tone: "error", text: res.error });
            if (res.ok) router.refresh();
          })
        }
      />
    </form>
  );
}

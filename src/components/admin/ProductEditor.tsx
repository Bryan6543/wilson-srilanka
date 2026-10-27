"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Copy, Eye, Trash2 } from "lucide-react";
import type { Availability, Category, LabelValue, Product, ProductImage, ProductVariant } from "@/types/product";
import { deleteProductAction, duplicateProductAction, saveProductAction } from "@/app/actions/admin";
import { applyDiscount } from "@/lib/pricing";
import { cn, formatPrice, slugify } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notice } from "@/components/ui/States";
import { ImageUploader } from "./ImageUploader";
import { ListEditor } from "./ListEditor";

interface Draft {
  name: string;
  slug: string;
  slugTouched: boolean;
  model: string;
  productCode: string;
  category: string;
  sport: string;
  description: string;
  features: string[];
  specifications: LabelValue[];
  profile: LabelValue[];
  idealFor: string[];
  inTheBox: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  price: string;
  compareAtPrice: string;
  discountPercent: string;
  discountLabel: string;
  currency: string;
  availability: Availability | "";
  retailerUrl: string;
  sourceUrl: string;
  sourceName: string;
  externalId: string;
  tags: string;
  featured: boolean;
  published: boolean;
  adminNotes: string;
}

function toDraft(p: Product | null, defaults: { category: string; retailerName: string }): Draft {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    slugTouched: !!p,
    model: p?.model ?? "",
    productCode: p?.productCode ?? "",
    category: p?.category ?? defaults.category,
    sport: p?.sport ?? "tennis",
    description: p?.description ?? "",
    features: p?.features ?? [],
    specifications: p?.specifications ?? [],
    profile: p?.profile ?? [],
    idealFor: p?.idealFor ?? [],
    inTheBox: p?.inTheBox ?? [],
    images: p?.images ?? [],
    variants: p?.variants ?? [],
    price: p?.price?.toString() ?? "",
    compareAtPrice: p?.compareAtPrice?.toString() ?? "",
    discountPercent: p?.discountPercent?.toString() ?? "",
    discountLabel: p?.discountLabel ?? "",
    currency: p?.currency ?? "LKR",
    availability: p?.availability ?? "",
    retailerUrl: p?.retailerUrl ?? "",
    sourceUrl: p?.sourceUrl ?? "",
    sourceName: p?.sourceName ?? (p ? "" : defaults.retailerName),
    externalId: p?.externalId ?? "",
    tags: p?.tags.join(", ") ?? "",
    featured: p?.featured ?? false,
    published: p?.published ?? false,
    adminNotes: p?.adminNotes ?? "",
  };
}

const num = (s: string) => {
  const t = s.replace(/[, ]/g, "");
  return t ? Number(t) : undefined;
};

function toPayload(d: Draft, skus: Product["skus"], published: boolean) {
  return {
    name: d.name,
    slug: d.slug || slugify(d.name),
    model: d.model,
    productCode: d.productCode,
    category: d.category,
    sport: d.sport,
    description: d.description,
    features: d.features.map((f) => f.trim()).filter(Boolean),
    specifications: d.specifications.filter((s) => s.label.trim() || s.value.trim()),
    profile: d.profile.filter((s) => s.label.trim() || s.value.trim()),
    idealFor: d.idealFor.map((f) => f.trim()).filter(Boolean),
    inTheBox: d.inTheBox.map((f) => f.trim()).filter(Boolean),
    images: d.images,
    variants: d.variants.filter((v) => v.name.trim() || v.value.trim()),
    skus,
    price: num(d.price),
    compareAtPrice: num(d.compareAtPrice),
    discountPercent: num(d.discountPercent.replace(/%$/, "")),
    discountLabel: d.discountLabel,
    currency: d.price ? d.currency : "",
    availability: d.availability,
    retailerUrl: d.retailerUrl,
    sourceUrl: d.sourceUrl,
    sourceName: d.sourceName,
    externalId: d.externalId,
    tags: d.tags
      .split(",")
      .map((t) => slugify(t))
      .filter(Boolean),
    featured: d.featured,
    published,
    adminNotes: d.adminNotes,
  };
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span aria-hidden className="text-accent">*</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProductEditor({
  product,
  categories,
  canSave,
  retailerName,
  notice,
}: {
  product: Product | null;
  categories: Category[];
  canSave: boolean;
  retailerName: string;
  notice?: string;
}) {
  const router = useRouter();
  const initial = useMemo(
    () => toDraft(product, { category: categories[0]?.slug ?? "", retailerName }),
    [product, categories, retailerName],
  );
  const [d, setD] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(
    notice ? { tone: "success", text: notice } : null,
  );
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];
  const aria = (key: string) => ({ "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${key}-error` : undefined });

  function save(publish: boolean) {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveProductAction(product?.id ?? null, toPayload(d, product?.skus ?? [], publish));
      if (res.ok) {
        setErrors({});
        setFeedback({ tone: "success", text: res.message ?? "Saved." });
        // The page remounts the editor with the saved data and shows the confirmation.
        if (!product && res.data) router.replace(`/admin/products/${res.data.id}?created=1`);
        else {
          router.replace(`/admin/products/${product!.id}?saved=${publish ? "published" : "draft"}`);
          router.refresh();
        }
      } else {
        setErrors(res.fieldErrors ?? {});
        setFeedback({ tone: "error", text: res.error });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const errorList = Object.entries(errors);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(d.published);
      }}
      className="space-y-6"
      noValidate
    >
      <div aria-live="polite" className="space-y-3">
        {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
        {errorList.length > 0 && (
          <Notice tone="error" title="Please fix these fields">
            <ul className="list-disc pl-5">
              {errorList.map(([k, m]) => (
                <li key={k}>
                  <span className="font-mono text-xs">{k}</span>: {m}
                </li>
              ))}
            </ul>
          </Notice>
        )}
        {product?.adminNotes && (
          <Notice tone="warning" title="Import notes">
            <pre className="whitespace-pre-wrap font-sans">{product.adminNotes}</pre>
          </Notice>
        )}
      </div>

      <Section title="Basics">
        <Field id="name" label="Product name" required error={err("name")} hint="Shown without the “Wilson” prefix, e.g. Blade 98 (16x19) Tennis Racket (V9)">
          <input
            id="name"
            className="field-input"
            value={d.name}
            onChange={(e) => setD((p) => ({ ...p, name: e.target.value, slug: p.slugTouched ? p.slug : slugify(e.target.value) }))}
            {...aria("name")}
          />
        </Field>
        <Field id="slug" label="URL slug" error={err("slug")} hint={`Page address: /products/${d.slug || slugify(d.name) || "…"}`}>
          <input
            id="slug"
            className="field-input font-mono text-sm"
            value={d.slug}
            onChange={(e) => setD((p) => ({ ...p, slug: slugify(e.target.value), slugTouched: true }))}
            {...aria("slug")}
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="category" label="Category" required error={err("category")}>
            <select
              id="category"
              className="field-input"
              value={d.category}
              onChange={(e) => {
                const c = categories.find((x) => x.slug === e.target.value);
                setD((p) => ({ ...p, category: e.target.value, sport: c?.sport ?? p.sport }));
              }}
              {...aria("category")}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="sport" label="Sport" error={err("sport")}>
            <select id="sport" className="field-input" value={d.sport} onChange={(e) => set("sport", e.target.value)}>
              <option value="tennis">Tennis</option>
              <option value="padel">Padel</option>
              <option value="pickleball">Pickleball</option>
            </select>
          </Field>
          <Field id="model" label="Model" error={err("model")}>
            <input id="model" className="field-input" value={d.model} onChange={(e) => set("model", e.target.value)} />
          </Field>
          <Field id="productCode" label="Wilson product code" error={err("productCode")} hint="e.g. WR149811U2">
            <input id="productCode" className="field-input font-mono text-sm" value={d.productCode} onChange={(e) => set("productCode", e.target.value)} />
          </Field>
        </div>
        <Field id="tags" label="Collections / tags" hint="Comma-separated, e.g. blade, junior. Used for filters and related products.">
          <input id="tags" className="field-input" value={d.tags} onChange={(e) => set("tags", e.target.value)} />
        </Field>
      </Section>

      <Section title="Description" description="Use verified information only, from Wilson or the retailer listing.">
        <Field id="description" label="Description" required error={err("description")} hint="Separate paragraphs with a blank line.">
          <textarea id="description" rows={7} className="field-input" value={d.description} onChange={(e) => set("description", e.target.value)} {...aria("description")} />
        </Field>
        <div>
          <p className="field-label">Key features</p>
          <ListEditor
            label="feature"
            items={d.features}
            onChange={(v) => set("features", v)}
            makeEmpty={() => ""}
            addLabel="Add feature"
            renderRow={(item, i, update) => (
              <input aria-label={`Feature ${i + 1}`} className="field-input" value={item} onChange={(e) => update(e.target.value)} />
            )}
          />
        </div>
      </Section>

      <Section title="Images" description="The primary image is shown on product cards. Use the arrows to set the gallery order.">
        <ImageUploader images={d.images} onChange={(v) => set("images", v)} productName={d.name} errors={errors} canUpload={canSave} />
      </Section>

      <Section title="Specifications" description="Only add values you have verified. Empty rows are ignored.">
        <ListEditor
          label="specification"
          items={d.specifications}
          onChange={(v) => set("specifications", v)}
          makeEmpty={() => ({ label: "", value: "" })}
          addLabel="Add specification"
          renderRow={(item, i, update) => (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
              <input aria-label={`Specification ${i + 1} name`} placeholder="e.g. Head size" className="field-input" value={item.label} onChange={(e) => update({ ...item, label: e.target.value })} aria-invalid={!!errors[`specifications.${i}.label`]} />
              <input aria-label={`Specification ${i + 1} value`} placeholder="e.g. 98 sq in" className="field-input" value={item.value} onChange={(e) => update({ ...item, value: e.target.value })} aria-invalid={!!errors[`specifications.${i}.value`]} />
            </div>
          )}
        />
        <div>
          <p className="field-label">Playing profile</p>
          <p className="field-hint -mt-1 mb-2">Ratings as published by the source, e.g. Power: Medium.</p>
          <ListEditor
            label="profile rating"
            items={d.profile}
            onChange={(v) => set("profile", v)}
            makeEmpty={() => ({ label: "", value: "" })}
            addLabel="Add rating"
            max={20}
            renderRow={(item, i, update) => (
              <div className="grid grid-cols-2 gap-2">
                <input aria-label={`Rating ${i + 1} name`} placeholder="Power" className="field-input" value={item.label} onChange={(e) => update({ ...item, label: e.target.value })} />
                <input aria-label={`Rating ${i + 1} value`} placeholder="Medium" className="field-input" value={item.value} onChange={(e) => update({ ...item, value: e.target.value })} />
              </div>
            )}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="field-label">Ideal for</p>
            <ListEditor label="ideal-for item" items={d.idealFor} onChange={(v) => set("idealFor", v)} makeEmpty={() => ""} addLabel="Add" max={20}
              renderRow={(item, i, update) => <input aria-label={`Ideal for ${i + 1}`} className="field-input" value={item} onChange={(e) => update(e.target.value)} />}
            />
          </div>
          <div>
            <p className="field-label">What’s included</p>
            <ListEditor label="included item" items={d.inTheBox} onChange={(v) => set("inTheBox", v)} makeEmpty={() => ""} addLabel="Add" max={20}
              renderRow={(item, i, update) => <input aria-label={`Included item ${i + 1}`} className="field-input" value={item} onChange={(e) => update(e.target.value)} />}
            />
          </div>
        </div>
      </Section>

      <Section title="Variants" description="Sizes, colours or grip sizes. Use the same option name for values that belong together (e.g. “Shoe size”).">
        <ListEditor
          label="variant"
          items={d.variants}
          onChange={(v) => set("variants", v)}
          makeEmpty={() => ({ name: d.variants.at(-1)?.name ?? "", value: "", available: true })}
          addLabel="Add variant"
          max={200}
          renderRow={(item, i, update) => (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] items-center gap-2">
              <input aria-label={`Variant ${i + 1} option name`} placeholder="Grip size" className="field-input" value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} />
              <input aria-label={`Variant ${i + 1} value`} placeholder="L2" className="field-input" value={item.value} onChange={(e) => update({ ...item, value: e.target.value })} />
              <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                <input type="checkbox" checked={item.available !== false} onChange={(e) => update({ ...item, available: e.target.checked })} className="size-4 accent-ink" />
                Available
              </label>
            </div>
          )}
        />
        {product && product.skus.length > 0 && (
          <p className="field-hint">
            {product.skus.length} retailer variant links are mapped for this product. They stay active while the option names and
            values above match the retailer’s.
          </p>
        )}
      </Section>

      <Section title="Price & availability" description="Use the local retailer’s verified price in rupees. Leave blank if unknown.">
        <div className="grid gap-5 md:grid-cols-4">
          <Field id="price" label="Price" error={err("price")}>
            <input id="price" inputMode="decimal" className="field-input" value={d.price} onChange={(e) => set("price", e.target.value)} {...aria("price")} />
          </Field>
          <Field id="compareAtPrice" label="Was price (sale)" error={err("compareAtPrice")} hint="Or use an offer % below">
            <input id="compareAtPrice" inputMode="decimal" className="field-input" value={d.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} {...aria("compareAtPrice")} />
          </Field>
          <Field id="currency" label="Currency" error={err("currency")}>
            <input id="currency" maxLength={3} className="field-input uppercase" value={d.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} {...aria("currency")} />
          </Field>
          <Field id="availability" label="Availability" error={err("availability")}>
            <select id="availability" className="field-input" value={d.availability} onChange={(e) => set("availability", e.target.value as Draft["availability"])}>
              <option value="">Not shown</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="preorder">Pre-order</option>
              <option value="unknown">Ask retailer</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section
        title="Offer discount"
        description="Shows the reduced price, the original price struck through and a % badge everywhere on the site."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field id="discountPercent" label="Discount %" error={err("discountPercent")} hint="Whole number 1–90. Leave blank for no offer.">
            <input
              id="discountPercent"
              inputMode="numeric"
              className="field-input"
              value={d.discountPercent}
              onChange={(e) => set("discountPercent", e.target.value)}
              {...aria("discountPercent")}
            />
          </Field>
          <Field id="discountLabel" label="Offer name" error={err("discountLabel")} hint="e.g. Anniversary Offer">
            <input id="discountLabel" className="field-input" value={d.discountLabel} onChange={(e) => set("discountLabel", e.target.value)} />
          </Field>
          <div className="text-sm">
            <p className="field-label">Offer price</p>
            <p className="pt-2">
              {(() => {
                const price = num(d.price);
                const pct = num(d.discountPercent.replace(/%$/, ""));
                if (price === undefined || !pct || pct <= 0 || pct >= 100) return <span className="text-muted">—</span>;
                return (
                  <>
                    <strong className="text-accent">{formatPrice(applyDiscount(price, pct), d.currency || "LKR")}</strong>{" "}
                    <s className="text-muted">{formatPrice(price, d.currency || "LKR")}</s>
                  </>
                );
              })()}
            </p>
          </div>
        </div>
        {product?.discountSource && d.discountPercent === (product.discountPercent?.toString() ?? "") && (
          <p className="field-hint">
            {product.discountSource === "retailer"
              ? `This offer comes from ${retailerName} and updates automatically when you sync. Changing it makes it a manual offer that sync will not touch.`
              : "Manual offer: retailer sync will not change it."}
          </p>
        )}
      </Section>

      <Section title="Retailer & source">
        <Field id="retailerUrl" label={`Product page at ${retailerName}`} error={err("retailerUrl")} hint="The exact product page. Leave blank to hide the Buy button.">
          <input id="retailerUrl" type="url" className="field-input" value={d.retailerUrl} onChange={(e) => set("retailerUrl", e.target.value)} placeholder="https://www.unitedsports.lk/products/…" {...aria("retailerUrl")} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="sourceUrl" label="Information source URL" error={err("sourceUrl")} hint="Where the description/specs came from.">
            <input id="sourceUrl" type="url" className="field-input" value={d.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} {...aria("sourceUrl")} />
          </Field>
          <Field id="sourceName" label="Source name" error={err("sourceName")}>
            <input id="sourceName" className="field-input" value={d.sourceName} onChange={(e) => set("sourceName", e.target.value)} />
          </Field>
        </div>
        {d.externalId && <p className="text-xs text-muted">Source ID: <code>{d.externalId}</code> (used to match retailer updates)</p>}
      </Section>

      <Section title="Visibility">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 size-4 accent-ink" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} />
          <span>
            <span className="font-semibold">Featured</span>
            <span className="block text-sm text-muted">Show in “Players’ picks” on the homepage.</span>
          </span>
        </label>
        <Field id="adminNotes" label="Internal notes" hint="Only visible to administrators.">
          <textarea id="adminNotes" rows={3} className="field-input" value={d.adminNotes} onChange={(e) => set("adminNotes", e.target.value)} />
        </Field>
      </Section>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white px-4 py-3 md:-mx-8 md:px-8">
        <span className={cn("text-sm", product?.published ? "text-success" : "text-muted")}>
          Status: <strong>{product ? (product.published ? "Published" : "Draft") : "New"}</strong>
          {dirty && <span className="text-warning"> · unsaved changes</span>}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {product && (
            <>
              <Link href={`/admin/products/${product.id}/preview`} className="btn btn-secondary btn-sm" target="_blank">
                <Eye aria-hidden className="size-4" /> Preview
              </Link>
              <button type="button" className="btn btn-secondary btn-sm" disabled={pending || !canSave} onClick={() => startTransition(async () => {
                const res = await duplicateProductAction(product.id);
                if (res && !res.ok) setFeedback({ tone: "error", text: res.error });
              })}>
                <Copy aria-hidden className="size-4" /> Duplicate
              </button>
              <button type="button" className="btn btn-secondary btn-sm text-error" disabled={pending || !canSave} onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden className="size-4" /> Delete
              </button>
            </>
          )}
          <button type="button" className="btn btn-secondary btn-sm" disabled={pending || !canSave} onClick={() => save(false)}>
            {product?.published ? "Unpublish & save" : "Save draft"}
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={pending || !canSave} onClick={() => save(true)}>
            {pending ? "Saving…" : product?.published ? "Save changes" : "Save & publish"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${product?.name ?? ""}”?`}
        body="This permanently removes the product from the website. To hide it temporarily, unpublish it instead."
        confirmLabel="Delete product"
        busy={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deleteProductAction(product!.id);
            setConfirmDelete(false);
            if (res.ok) router.replace("/admin/products");
            else setFeedback({ tone: "error", text: res.error });
          })
        }
      />
    </form>
  );
}

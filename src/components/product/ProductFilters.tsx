"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/product-query";
import { cn, formatPrice } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterConfig {
  categories?: FilterOption[];
  tags: FilterOption[];
  priceBounds: { min: number; max: number } | null;
  /** Hidden on pages that already show only offers. */
  hideOfferFilter?: boolean;
}

/** Shared hook: read/write catalogue filters in the URL (shareable, back-button friendly). */
function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page"); // any filter change returns to page 1
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const listParam = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggleInList = (key: string, value: string) =>
    update((p) => {
      const current = listParam(key);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });
  return { params, update, listParam, toggleInList, pending };
}

function CheckboxGroup({
  legend,
  name,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  name: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (!options.length) return null;
  return (
    <fieldset className="border-t border-line-soft py-5">
      <legend className="font-extended float-left mb-3 w-full text-[11px]">{legend}</legend>
      <ul className="clear-both space-y-2">
        {options.map((o) => {
          const id = `f-${name}-${o.value}`;
          return (
            <li key={o.value} className="flex items-center gap-2">
              <input
                id={id}
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
                className="size-4 accent-ink"
              />
              <label htmlFor={id} className="flex flex-1 cursor-pointer justify-between text-sm">
                {o.label}
                <span className="text-muted">{o.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function PriceFilter({ bounds }: { bounds: { min: number; max: number } }) {
  const { params, update } = useFilterParams();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [synced, setSynced] = useState(params.toString());
  if (synced !== params.toString()) {
    setSynced(params.toString());
    setMin(params.get("min") ?? "");
    setMax(params.get("max") ?? "");
  }
  return (
    <fieldset className="border-t border-line-soft py-5">
      <legend className="font-extended float-left mb-3 w-full text-[11px]">Price (Rs.)</legend>
      <form
        className="clear-both"
        onSubmit={(e) => {
          e.preventDefault();
          update((p) => {
            if (min) p.set("min", String(Math.max(0, Number(min))));
            else p.delete("min");
            if (max) p.set("max", String(Math.max(0, Number(max))));
            else p.delete("max");
          });
        }}
      >
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="price-min">Minimum price</label>
          <input
            id="price-min"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(bounds.min)}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="field-input min-h-10 py-2 text-sm"
          />
          <span aria-hidden>–</span>
          <label className="sr-only" htmlFor="price-max">Maximum price</label>
          <input
            id="price-max"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(bounds.max)}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="field-input min-h-10 py-2 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Range {formatPrice(bounds.min)} – {formatPrice(bounds.max)}
        </p>
        <button type="submit" className="btn btn-secondary btn-sm mt-3 w-full">
          Apply price
        </button>
      </form>
    </fieldset>
  );
}

function FilterPanel({ config }: { config: FilterConfig }) {
  const { params, update, listParam, toggleInList, pending } = useFilterParams();
  const active = ["category", "tag", "min", "max", "stock", "offer"].some((k) => params.has(k));
  return (
    <div aria-busy={pending} className={cn(pending && "opacity-60 transition-opacity")}>
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-sm font-bold">Filters</h2>
        {active && (
          <button
            type="button"
            className="text-xs underline"
            onClick={() => update((p) => ["category", "tag", "min", "max", "stock", "offer"].forEach((k) => p.delete(k)))}
          >
            Clear all
          </button>
        )}
      </div>
      <div className="border-t border-line-soft py-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={params.get("stock") === "in"}
            onChange={(e) => update((p) => (e.target.checked ? p.set("stock", "in") : p.delete("stock")))}
            className="size-4 accent-ink"
          />
          In stock only
        </label>
        <label className={cn("mt-3 flex cursor-pointer items-center gap-2 text-sm", config.hideOfferFilter && "hidden")}>
          <input
            type="checkbox"
            checked={params.get("offer") === "1"}
            onChange={(e) => update((p) => (e.target.checked ? p.set("offer", "1") : p.delete("offer")))}
            className="size-4 accent-accent"
          />
          <span>
            On offer <span className="text-accent">%</span>
          </span>
        </label>
      </div>
      {config.categories && (
        <CheckboxGroup
          legend="Category"
          name="category"
          options={config.categories}
          selected={listParam("category")}
          onToggle={(v) => toggleInList("category", v)}
        />
      )}
      <CheckboxGroup
        legend="Collection"
        name="tag"
        options={config.tags}
        selected={listParam("tag")}
        onToggle={(v) => toggleInList("tag", v)}
      />
      {config.priceBounds && <PriceFilter bounds={config.priceBounds} />}
    </div>
  );
}

/** Desktop sidebar. */
export function ProductFilters({ config }: { config: FilterConfig }) {
  return (
    <aside aria-label="Product filters" className="hidden lg:block">
      <div className="sticky top-28">
        <FilterPanel config={config} />
      </div>
    </aside>
  );
}

/** Result count, sort control and the mobile filter drawer. */
export function CatalogToolbar({ total, config }: { total: number; config: FilterConfig }) {
  const { params, update } = useFilterParams();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeCount = ["category", "tag", "min", "max", "stock", "offer"].filter((k) => params.has(k)).length;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <p className="text-sm text-muted" aria-live="polite">
        {total} {total === 1 ? "product" : "products"}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="btn btn-secondary btn-sm lg:hidden"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
        <label htmlFor="sort" className="sr-only">
          Sort products
        </label>
        <select
          id="sort"
          value={params.get("sort") ?? "relevance"}
          onChange={(e) => update((p) => (e.target.value === "relevance" ? p.delete("sort") : p.set("sort", e.target.value)))}
          className="field-input min-h-9 w-auto py-1.5 pr-8 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === "relevance" && params.get("q") ? "Best match" : o.label}
            </option>
          ))}
        </select>
      </div>
      <dialog
        ref={dialogRef}
        aria-label="Filters"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,100%)] max-w-none bg-white p-0 backdrop:bg-black/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-line-soft px-4">
            <span className="font-bold">Filter products</span>
            <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="p-2">
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-4">
            <FilterPanel config={config} />
          </div>
          <div className="border-t border-line-soft p-4">
            <button type="button" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
              Show {total} {total === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

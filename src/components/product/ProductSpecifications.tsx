import type { Product } from "@/types/product";

/** Renders only the sections that have data — empty rows are never shown. */
export function ProductSpecifications({ product }: { product: Product }) {
  const specs = [
    ...(product.model ? [{ label: "Model", value: product.model }] : []),
    ...(product.productCode ? [{ label: "Product code", value: product.productCode }] : []),
    ...product.specifications,
  ].filter((s) => s.label.trim() && s.value.trim());

  return (
    <div className="space-y-10">
      {product.features.length > 0 && (
        <section aria-labelledby="features-h">
          <h2 id="features-h" className="font-extended text-xs">Key features</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {product.features.map((f) => (
              <li key={f} className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {specs.length > 0 && (
        <section aria-labelledby="specs-h">
          <h2 id="specs-h" className="font-extended text-xs">Specifications</h2>
          <dl className="mt-4 divide-y divide-line-soft border-y border-line-soft text-sm">
            {specs.map((s) => (
              <div key={`${s.label}-${s.value}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3">
                <dt className="text-muted">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.profile.length > 0 && (
        <section aria-labelledby="profile-h">
          <h2 id="profile-h" className="font-extended text-xs">Playing profile</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {product.profile.map((s) => (
              <div key={s.label} className="bg-surface-alt px-3 py-3">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="mt-1 font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
          {product.sourceName && <p className="mt-2 text-xs text-muted">As described by {product.sourceName}.</p>}
        </section>
      )}

      {(product.idealFor.length > 0 || product.inTheBox.length > 0) && (
        <div className="grid gap-10 sm:grid-cols-2">
          {product.idealFor.length > 0 && (
            <section aria-labelledby="ideal-h">
              <h2 id="ideal-h" className="font-extended text-xs">Ideal for</h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                {product.idealFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {product.inTheBox.length > 0 && (
            <section aria-labelledby="box-h">
              <h2 id="box-h" className="font-extended text-xs">What’s included</h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                {product.inTheBox.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

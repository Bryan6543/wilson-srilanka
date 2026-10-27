import type { Category, Product } from "@/types/product";
import { ProductGrid } from "./ProductGrid";

export function RelatedProducts({
  products,
  categories,
  title = "You may also like",
}: {
  products: Product[];
  categories: Category[];
  title?: string;
}) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="related-h" className="container-site mt-24">
      <h2 id="related-h" className="font-display mb-8 text-4xl md:text-5xl">
        {title}
      </h2>
      <ProductGrid products={products} categories={categories} priorityCount={0} />
    </section>
  );
}

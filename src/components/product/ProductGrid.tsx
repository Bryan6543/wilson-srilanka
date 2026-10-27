import type { Category, Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  categories,
  className,
  priorityCount = 4,
}: {
  products: Product[];
  categories: Pick<Category, "slug" | "name">[];
  className?: string;
  priorityCount?: number;
}) {
  const names = new Map(categories.map((c) => [c.slug, c.name]));
  return (
    <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} categoryName={names.get(p.category)} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

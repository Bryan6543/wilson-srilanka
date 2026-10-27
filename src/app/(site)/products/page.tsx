import type { Metadata } from "next";
import { CatalogView } from "@/components/product/CatalogView";

export const metadata: Metadata = {
  title: "All Wilson Products",
  description: "Browse genuine Wilson tennis rackets, balls, bags, shoes, accessories and basketballs available in Sri Lanka.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  return (
    <CatalogView
      basePath="/products"
      params={params}
      title="All products"
      intro="Every Wilson product currently listed for Sri Lanka, with prices in rupees from the local retailer."
      crumbs={[{ label: "Products", href: "/products" }]}
    />
  );
}

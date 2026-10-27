import "server-only";
import seedProducts from "@/data/products.seed.json";
import { SEED_CATEGORIES } from "@/data/categories";
import { DEFAULT_SITE_CONTENT } from "@/data/site-content";
import type { Category, Product, SiteContent } from "@/types/product";
import { StoreNotWritableError, type DataStore } from "./types";

export const SEED_PRODUCTS = seedProducts as unknown as Product[];

/** Read-only store backed by the bundled seed files. Used when nothing else is configured. */
export class SeedStore implements DataStore {
  readonly kind = "seed" as const;
  readonly writable = false;

  async listProducts(): Promise<Product[]> {
    return structuredClone(SEED_PRODUCTS);
  }
  async getProduct(id: string): Promise<Product | null> {
    return structuredClone(SEED_PRODUCTS.find((p) => p.id === id) ?? null);
  }
  async listCategories(): Promise<Category[]> {
    return structuredClone(SEED_CATEGORIES);
  }
  async getSiteContent(): Promise<SiteContent> {
    return structuredClone(DEFAULT_SITE_CONTENT);
  }

  async upsertProduct(): Promise<Product> {
    throw new StoreNotWritableError();
  }
  async upsertProducts(): Promise<void> {
    throw new StoreNotWritableError();
  }
  async deleteProduct(): Promise<void> {
    throw new StoreNotWritableError();
  }
  async upsertCategory(): Promise<Category> {
    throw new StoreNotWritableError();
  }
  async deleteCategory(): Promise<void> {
    throw new StoreNotWritableError();
  }
  async saveSiteContent(): Promise<void> {
    throw new StoreNotWritableError();
  }
  async addSubscriber(): Promise<"added" | "exists"> {
    throw new StoreNotWritableError();
  }
  async saveImage(): Promise<string> {
    throw new StoreNotWritableError();
  }
}

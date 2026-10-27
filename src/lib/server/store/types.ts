import type { Category, Product, SiteContent } from "@/types/product";

export type StoreKind = "supabase" | "local" | "seed";

/** Thrown when a write is attempted against a read-only store. */
export class StoreNotWritableError extends Error {
  constructor() {
    super(
      "Changes cannot be saved because persistent storage is not configured. Add the Supabase settings described in README.md.",
    );
    this.name = "StoreNotWritableError";
  }
}

export interface DataStore {
  readonly kind: StoreKind;
  readonly writable: boolean;

  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  upsertProduct(product: Product): Promise<Product>;
  upsertProducts(products: Product[]): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  listCategories(): Promise<Category[]>;
  upsertCategory(category: Category): Promise<Category>;
  deleteCategory(slug: string): Promise<void>;

  getSiteContent(): Promise<SiteContent>;
  saveSiteContent(content: SiteContent): Promise<void>;

  addSubscriber(email: string): Promise<"added" | "exists">;

  /** Stores an already-processed image and returns its public URL. */
  saveImage(data: Buffer, fileName: string, contentType: string): Promise<string>;
}

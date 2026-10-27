import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Category, Product, SiteContent } from "@/types/product";
import { withContentDefaults } from "@/data/site-content";
import { env } from "../env";
import type { DataStore } from "./types";

// Products keep a few indexed/constrained columns plus the full document in `data` (jsonb),
// so the schema can evolve (e.g. native commerce later) without risky migrations.
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  published: boolean;
  featured: boolean;
  external_id: string | null;
  data: Product;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  slug: string;
  name: string;
  sport: string | null;
  description: string;
  image: string | null;
  sort_order: number;
  visible: boolean;
}

const toRow = (p: Product): ProductRow => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  published: p.published,
  featured: p.featured,
  external_id: p.externalId ?? null,
  data: p,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

const fromRow = (r: ProductRow): Product => ({
  ...r.data,
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  published: r.published,
  featured: r.featured,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toCategory = (r: CategoryRow): Category => ({
  slug: r.slug,
  name: r.name,
  sport: r.sport ?? undefined,
  description: r.description,
  image: r.image ?? undefined,
  sortOrder: r.sort_order,
  visible: r.visible,
});

/** Converts Supabase errors into safe, actionable messages (details go to server logs). */
function fail(op: string, error: { code?: string; message: string }): never {
  console.error(`[supabase] ${op} failed:`, error.code, error.message);
  if (error.code === "23505") throw new Error("Another record already uses that slug or source ID.");
  if (error.code === "23503") throw new Error("That category is still in use by products, or does not exist.");
  throw new Error(`Database error while trying to ${op}. Please try again.`);
}

export class SupabaseStore implements DataStore {
  readonly kind = "supabase" as const;
  readonly writable = true;
  private db: SupabaseClient;

  constructor() {
    this.db = createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async listProducts() {
    const out: Product[] = [];
    // Page through results (PostgREST caps rows per request).
    for (let from = 0; ; from += 1000) {
      const { data, error } = await this.db
        .from("products")
        .select("*")
        .order("name")
        .range(from, from + 999);
      if (error) fail("load products", error);
      out.push(...(data as ProductRow[]).map(fromRow));
      if (data.length < 1000) break;
    }
    return out;
  }
  async getProduct(id: string) {
    const { data, error } = await this.db.from("products").select("*").eq("id", id).maybeSingle();
    if (error) fail("load the product", error);
    return data ? fromRow(data as ProductRow) : null;
  }
  async upsertProduct(product: Product) {
    const { data, error } = await this.db.from("products").upsert(toRow(product)).select("*").single();
    if (error) fail("save the product", error);
    return fromRow(data as ProductRow);
  }
  async upsertProducts(products: Product[]) {
    for (let i = 0; i < products.length; i += 200) {
      const { error } = await this.db.from("products").upsert(products.slice(i, i + 200).map(toRow));
      if (error) fail("save products", error);
    }
  }
  async deleteProduct(id: string) {
    const { error } = await this.db.from("products").delete().eq("id", id);
    if (error) fail("delete the product", error);
  }

  async listCategories() {
    const { data, error } = await this.db.from("categories").select("*").order("sort_order");
    if (error) fail("load categories", error);
    return (data as CategoryRow[]).map(toCategory);
  }
  async upsertCategory(c: Category) {
    const row: CategoryRow = {
      slug: c.slug,
      name: c.name,
      sport: c.sport ?? null,
      description: c.description,
      image: c.image ?? null,
      sort_order: c.sortOrder,
      visible: c.visible,
    };
    const { data, error } = await this.db.from("categories").upsert(row).select("*").single();
    if (error) fail("save the category", error);
    return toCategory(data as CategoryRow);
  }
  async deleteCategory(slug: string) {
    const { error } = await this.db.from("categories").delete().eq("slug", slug);
    if (error) fail("delete the category", error);
  }

  async getSiteContent() {
    const { data, error } = await this.db.from("site_content").select("value").eq("key", "site").maybeSingle();
    if (error) fail("load site content", error);
    // Merge so newly added content fields always have defaults.
    return withContentDefaults(data?.value as Partial<SiteContent> | undefined);
  }
  async saveSiteContent(content: SiteContent) {
    const { error } = await this.db
      .from("site_content")
      .upsert({ key: "site", value: content, updated_at: new Date().toISOString() });
    if (error) fail("save site content", error);
  }

  async addSubscriber(email: string) {
    const { error } = await this.db.from("subscribers").insert({ email });
    if (error?.code === "23505") return "exists" as const;
    if (error) fail("save the subscription", error);
    return "added" as const;
  }

  async saveImage(data: Buffer, fileName: string, contentType: string) {
    const objectPath = `products/${new Date().toISOString().slice(0, 7)}/${randomUUID()}-${fileName
      .replace(/[^a-z0-9.-]/gi, "")
      .slice(-60)}`;
    const { error } = await this.db.storage
      .from(env.supabaseBucket)
      .upload(objectPath, data, { contentType, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("[supabase] image upload failed:", error.message);
      throw new Error("The image could not be stored. Please try again.");
    }
    const url = this.db.storage.from(env.supabaseBucket).getPublicUrl(objectPath).data.publicUrl;
    await this.db.from("site_images").insert({ path: objectPath, url, content_type: contentType, bytes: data.length });
    return url;
  }

  /** Atomic fixed-window rate limit via the `rate_limit_hit` SQL function. */
  async rateLimitHit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const { data, error } = await this.db.rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  }
}

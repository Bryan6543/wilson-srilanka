import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Category, Product, SiteContent } from "@/types/product";
import { SEED_CATEGORIES } from "@/data/categories";
import { DEFAULT_SITE_CONTENT, withContentDefaults } from "@/data/site-content";
import { SEED_PRODUCTS } from "./seed-store";
import type { DataStore } from "./types";

/**
 * DEVELOPMENT-ONLY persistent store: a JSON file in `.data/` plus uploaded images in
 * `.data/uploads/`. Lets the admin workflow be tried locally without Supabase.
 * It is never selected on serverless hosts (see lib/server/database.ts).
 */
interface LocalData {
  products: Product[];
  categories: Category[];
  content: SiteContent;
  subscribers: { email: string; createdAt: string }[];
}

export const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
export const LOCAL_UPLOAD_DIR = path.join(LOCAL_DATA_DIR, "uploads");
const DATA_FILE = path.join(LOCAL_DATA_DIR, "catalog.json");

// Serialise writes within this process so concurrent saves cannot interleave.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function load(): Promise<LocalData> {
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf8")) as LocalData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return {
      products: structuredClone(SEED_PRODUCTS),
      categories: structuredClone(SEED_CATEGORIES),
      content: structuredClone(DEFAULT_SITE_CONTENT),
      subscribers: [],
    };
  }
}

async function save(data: LocalData): Promise<void> {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, DATA_FILE); // atomic replace
}

function mutate<T>(fn: (data: LocalData) => T): Promise<T> {
  return exclusive(async () => {
    const data = await load();
    const result = fn(data);
    await save(data);
    return result;
  });
}

export class LocalStore implements DataStore {
  readonly kind = "local" as const;
  readonly writable = true;

  async listProducts() {
    return (await load()).products;
  }
  async getProduct(id: string) {
    return (await load()).products.find((p) => p.id === id) ?? null;
  }
  async upsertProduct(product: Product) {
    return mutate((d) => {
      const i = d.products.findIndex((p) => p.id === product.id);
      if (i >= 0) d.products[i] = product;
      else d.products.push(product);
      return product;
    });
  }
  async upsertProducts(products: Product[]) {
    await mutate((d) => {
      for (const product of products) {
        const i = d.products.findIndex((p) => p.id === product.id);
        if (i >= 0) d.products[i] = product;
        else d.products.push(product);
      }
    });
  }
  async deleteProduct(id: string) {
    await mutate((d) => {
      d.products = d.products.filter((p) => p.id !== id);
    });
  }
  async listCategories() {
    return (await load()).categories;
  }
  async upsertCategory(category: Category) {
    return mutate((d) => {
      const i = d.categories.findIndex((c) => c.slug === category.slug);
      if (i >= 0) d.categories[i] = category;
      else d.categories.push(category);
      return category;
    });
  }
  async deleteCategory(slug: string) {
    await mutate((d) => {
      d.categories = d.categories.filter((c) => c.slug !== slug);
    });
  }
  async getSiteContent() {
    return withContentDefaults((await load()).content);
  }
  async saveSiteContent(content: SiteContent) {
    await mutate((d) => {
      d.content = content;
    });
  }
  async addSubscriber(email: string) {
    return mutate((d) => {
      if (d.subscribers.some((s) => s.email === email)) return "exists" as const;
      d.subscribers.push({ email, createdAt: new Date().toISOString() });
      return "added" as const;
    });
  }
  async saveImage(data: Buffer, fileName: string) {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const safe = `${randomUUID()}-${fileName.replace(/[^a-z0-9.-]/gi, "").slice(-60)}`;
    await writeFile(path.join(LOCAL_UPLOAD_DIR, safe), data);
    return `/api/media/${safe}`;
  }
}

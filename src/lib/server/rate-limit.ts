import "server-only";
import { headers } from "next/headers";
import { getStore } from "./database";
import { SupabaseStore } from "./store/supabase-store";

// Fixed-window rate limiting. Uses the database when Supabase is configured (shared across
// serverless instances); otherwise an in-memory window per server process.
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    if (memory.size > 10_000) {
      for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
    }
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

/** Returns true when the action is allowed, false when the limit is exceeded. */
export async function rateLimit(bucket: string, id: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${bucket}:${id}`;
  const store = getStore();
  if (store instanceof SupabaseStore) {
    try {
      return await store.rateLimitHit(key, limit, windowSeconds);
    } catch (err) {
      console.error("[rate-limit] database limiter unavailable, falling back to memory:", err);
    }
  }
  return memoryHit(key, limit, windowSeconds);
}

/** Best-effort client IP from trusted platform headers. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

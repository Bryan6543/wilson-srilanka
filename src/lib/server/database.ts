import "server-only";
import { env, services } from "./env";
import { LocalStore } from "./store/local-store";
import { SeedStore } from "./store/seed-store";
import { SupabaseStore } from "./store/supabase-store";
import type { DataStore } from "./store/types";

let store: DataStore | undefined;

/**
 * Selects the data store:
 *  1. Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (production).
 *  2. Local JSON file store when LOCAL_DATA_STORE=true, never on serverless hosts (dev only).
 *  3. Otherwise the read-only bundled seed catalogue.
 */
export function getStore(): DataStore {
  if (!store) {
    if (services.supabase) store = new SupabaseStore();
    else if (env.localDataStore && !env.onServerlessHost) store = new LocalStore();
    else store = new SeedStore();
  }
  return store;
}

export function storeStatus() {
  const s = getStore();
  return { kind: s.kind, writable: s.writable };
}

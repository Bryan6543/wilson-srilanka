"use client";

import { useSyncExternalStore } from "react";

// Per-visitor wishlist kept in localStorage (no account needed). Stores product slugs.
const KEY = "wsl-wishlist";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string").slice(0, 200) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode/quota) — keep the in-memory list for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (slug: string) => items.includes(slug),
    toggle: (slug: string) => write(items.includes(slug) ? items.filter((s) => s !== slug) : [slug, ...items]),
    remove: (slug: string) => write(items.filter((s) => s !== slug)),
    clear: () => write([]),
  };
}

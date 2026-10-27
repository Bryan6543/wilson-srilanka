"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/utils";

interface Suggestion {
  slug: string;
  name: string;
  category: string;
  price?: number;
  wasPrice?: number;
  currency?: string;
  image?: string;
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Keyboard shortcut: "/" opens search (when not typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const term = q.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error();
        setResults(((await res.json()) as { results: Suggestion[] }).results);
        setStatus("idle");
      } catch {
        if (!ctrl.signal.aborted) setStatus("error");
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);
  const shown = term.length < 2 ? [] : results;

  return (
    <>
      <button
        type="button"
        aria-label="Search products"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center"
      >
        <Search aria-hidden className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Search"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        className="mx-auto mt-0 w-full max-w-none bg-transparent p-0 backdrop:bg-black/40"
      >
        <div className="bg-white shadow-xl">
          <div className="container-site py-4">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
              }}
              className="flex items-center gap-3 border-b-2 border-ink"
            >
              <Search aria-hidden className="size-5 shrink-0" />
              <label htmlFor="site-search" className="sr-only">
                Search Wilson products
              </label>
              <input
                id="site-search"
                type="search"
                autoFocus
                autoComplete="off"
                placeholder="Search rackets, balls, bags…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-controls={listId}
                className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-muted"
              />
              <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="p-2">
                <X aria-hidden className="size-5" />
              </button>
            </form>
            <div id={listId} aria-live="polite" className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
              {status === "error" && <p className="py-4 text-sm text-error">Search is unavailable right now.</p>}
              {term.length >= 2 && status === "idle" && !shown.length && (
                <p className="py-4 text-sm text-muted">No products match “{term}”.</p>
              )}
              {shown.length > 0 && (
                <ul className="divide-y divide-line-soft">
                  {shown.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/products/${r.slug}`} className="flex min-w-0 items-center gap-3 py-3 hover:bg-surface-alt">
                        <div className="relative size-14 shrink-0 bg-surface-warm">
                          <SafeImage src={r.image} alt="" fill sizes="56px" className="object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-muted">{r.category}</p>
                        </div>
                        {r.price !== undefined && (
                          <p className="shrink-0 whitespace-nowrap pr-1 text-right text-sm">
                            <span className={r.wasPrice !== undefined ? "font-semibold text-accent" : undefined}>
                              {formatPrice(r.price, r.currency)}
                            </span>
                            {r.wasPrice !== undefined && (
                              <s className="block text-xs text-muted">{formatPrice(r.wasPrice, r.currency)}</s>
                            )}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={`/search?q=${encodeURIComponent(term)}`} className="link-underline block py-3 text-sm font-semibold">
                      See all results for “{term}”
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

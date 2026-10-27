import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Params = Record<string, string | string[] | undefined>;

function hrefFor(basePath: string, params: Params, page: number) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "page" || v === undefined) continue;
    qs.set(k, Array.isArray(v) ? v.join(",") : v);
  }
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: Params;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link href={hrefFor(basePath, params, page - 1)} className="flex size-10 items-center justify-center" aria-label="Previous page">
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={hrefFor(basePath, params, p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(
              "flex size-10 items-center justify-center rounded-sm text-sm",
              p === page ? "bg-ink-strong text-white" : "hover:bg-surface-alt",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={hrefFor(basePath, params, page + 1)} className="flex size-10 items-center justify-center" aria-label="Next page">
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      )}
    </nav>
  );
}

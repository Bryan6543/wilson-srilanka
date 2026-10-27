import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl, jsonLd } from "@/lib/seo";

export interface Crumb {
  label: string;
  href: string;
}

/** Visible breadcrumb trail plus BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden className="size-3" />}
            {i === all.length - 1 ? (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-ink hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </nav>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { OfferSummary } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Promotional block for the current Wilson offers. All numbers come from live catalogue data,
 * so it updates (or disappears) automatically when offers change.
 */
export function OffersBanner({
  summary,
  retailerName,
  variant = "home",
  activePercent,
}: {
  summary: OfferSummary;
  retailerName: string;
  variant?: "home" | "page";
  activePercent?: number;
}) {
  const title = summary.label ? `${summary.label}s` : "Wilson offers";
  return (
    <section
      aria-labelledby="offers-banner-h"
      className={cn("on-dark relative isolate overflow-hidden bg-accent text-white", variant === "page" && "mt-6")}
    >
      <div
        aria-hidden
        className="font-display pointer-events-none absolute -right-6 -top-10 -z-10 select-none text-[14rem] leading-none text-white/10 md:text-[22rem]"
      >
        {summary.maxPercent}%
      </div>
      <div
        className={cn(
          "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
          variant === "home" ? "container-site py-12 md:py-16" : "px-6 py-10 md:px-10",
        )}
      >
        <div className="max-w-2xl">
          <p className="font-extended text-xs text-white/85">{title} · Wilson Sri Lanka</p>
          <h2 id="offers-banner-h" className="font-display mt-3 text-5xl sm:text-6xl md:text-7xl">
            Up to {summary.maxPercent}% off Wilson
          </h2>
          <p className="mt-4 text-base text-white/90 md:text-lg">
            {summary.count} Wilson rackets, bags, shoes and more are discounted at {retailerName}. The discounted
            price is shown on every product.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <ul className="flex flex-wrap gap-2" aria-label="Discount levels">
            {summary.tiers.map((t) => (
              <li key={t.percent}>
                <Link
                  href={`/offers?pct=${t.percent}`}
                  aria-current={activePercent === t.percent ? "true" : undefined}
                  className={cn(
                    "block border px-3 py-2 text-center transition-colors",
                    activePercent === t.percent ? "border-white bg-white text-accent" : "border-white/60 hover:bg-white/10",
                  )}
                >
                  <span className="font-display block text-3xl">{t.percent}%</span>
                  <span className="text-[11px]">
                    {t.count} {t.count === 1 ? "product" : "products"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {variant === "home" && (
            <Link href="/offers" className="btn btn-light">
              Shop all offers <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

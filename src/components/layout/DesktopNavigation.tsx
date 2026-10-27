"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { STATIC_NAV, type NavSport } from "./nav-types";

function MegaMenu({ sport }: { sport: NavSport }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close when navigating — adjust state during render instead of in an effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const active = pathname.startsWith("/category/") && sport.categories.some((c) => pathname === `/category/${c.slug}`);

  return (
    <div
      ref={wrapRef}
      className="static"
      onMouseEnter={() => {
        clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        closeTimer.current = setTimeout(() => setOpen(false), 150);
      }}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "font-extended flex h-16 items-center gap-1 border-b-2 px-3 text-xs transition-colors",
          open || active ? "border-ink" : "border-transparent hover:border-line",
        )}
      >
        {sport.label}
        <ChevronDown aria-hidden className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-t border-line-soft bg-white shadow-[0_12px_24px_-12px_rgba(0,0,0,0.25)]"
      >
        <div className="container-site grid grid-cols-[minmax(0,1fr)_16rem] gap-10 py-8">
          <div>
            <p className="font-extended mb-4 text-[11px] text-muted">Shop {sport.label}</p>
            <ul className="grid grid-cols-3 gap-4 xl:grid-cols-5">
              {sport.categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="group block">
                    <div className="relative aspect-square overflow-hidden bg-surface-warm">
                      <SafeImage
                        src={c.image}
                        alt=""
                        fill
                        sizes="12rem"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="mt-2 block text-sm font-semibold group-hover:underline">{c.name}</span>
                    <span className="text-xs text-muted">{c.count} products</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-between border-l border-line-soft pl-8">
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={sport.href} className="font-semibold hover:underline">
                  Shop all {sport.label.toLowerCase()}
                </Link>
              </li>
              <li>
                <Link href={`${sport.href}&sort=newest`} className="hover:underline">
                  Recently added
                </Link>
              </li>
              <li>
                <Link href={`${sport.href}&stock=in`} className="hover:underline">
                  In stock now
                </Link>
              </li>
              {sport.key === "tennis" && (
                <li>
                  <Link href="/technologies" className="hover:underline">
                    Racket technologies
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesktopNavigation({ sports }: { sports: NavSport[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center">
        <li>
          <Link
            href="/offers"
            aria-current={pathname.startsWith("/offers") ? "page" : undefined}
            className={cn(
              "font-extended flex h-16 items-center border-b-2 px-3 text-xs text-accent",
              pathname.startsWith("/offers") ? "border-accent" : "border-transparent hover:border-accent/40",
            )}
          >
            Offers
          </Link>
        </li>
        {sports.map((s) => (
          <li key={s.key}>
            {s.categories.length > 1 ? (
              <MegaMenu sport={s} />
            ) : (
              <Link
                href={s.categories[0] ? `/category/${s.categories[0].slug}` : s.href}
                className="font-extended flex h-16 items-center border-b-2 border-transparent px-3 text-xs hover:border-line"
              >
                {s.label}
              </Link>
            )}
          </li>
        ))}
        {STATIC_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              className={cn(
                "font-extended flex h-16 items-center border-b-2 px-3 text-xs",
                pathname.startsWith(item.href) ? "border-ink" : "border-transparent hover:border-line",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

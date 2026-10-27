"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { STATIC_NAV, type NavSport } from "./nav-types";

export function MobileNavigation({ sports }: { sports: NavSport[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(sports[0]?.key ?? null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

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

  return (
    <>
      <button
        type="button"
        className="flex size-10 items-center justify-center lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden className="size-6" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        className="m-0 h-dvh max-h-none w-[min(24rem,100%)] max-w-none bg-white p-0 backdrop:bg-black/40 open:animate-[fade-up_0.2s_ease-out]"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line-soft px-4">
            <Logo className="h-6" />
            <button
              type="button"
              className="flex size-10 items-center justify-center"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              autoFocus
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-2">
            <ul>
              <li className="border-b border-line-soft">
                <Link href="/offers" className="font-extended block py-4 text-sm text-accent">
                  Offers
                </Link>
              </li>
              {sports.map((s) => (
                <li key={s.key} className="border-b border-line-soft">
                  <button
                    type="button"
                    className="font-extended flex w-full items-center justify-between py-4 text-sm"
                    aria-expanded={expanded === s.key}
                    aria-controls={`m-${s.key}`}
                    onClick={() => setExpanded((k) => (k === s.key ? null : s.key))}
                  >
                    {s.label}
                    <ChevronDown aria-hidden className={cn("size-4 transition-transform", expanded === s.key && "rotate-180")} />
                  </button>
                  <ul id={`m-${s.key}`} hidden={expanded !== s.key} className="pb-3">
                    <li>
                      <Link href={s.href} className="block py-2 pl-3 text-sm font-semibold">
                        Shop all {s.label.toLowerCase()}
                      </Link>
                    </li>
                    {s.categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/category/${c.slug}`}
                          aria-current={pathname === `/category/${c.slug}` ? "page" : undefined}
                          className="flex justify-between py-2 pl-3 text-sm"
                        >
                          {c.name}
                          <span className="text-muted">{c.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {STATIC_NAV.map((item) => (
                <li key={item.href} className="border-b border-line-soft">
                  <Link href={item.href} className="font-extended block py-4 text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-1 text-sm">
              <li>
                <Link href="/search" className="flex items-center gap-3 py-2">
                  <Search aria-hidden className="size-4" /> Search
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="flex items-center gap-3 py-2">
                  <Heart aria-hidden className="size-4" /> Wishlist
                </Link>
              </li>
              <li>
                <Link href="/contact" className="flex items-center gap-3 py-2">
                  Contact &amp; store
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}

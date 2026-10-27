"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, FolderTree, LayoutDashboard, Package, PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/import", label: "Import / export", icon: FileSpreadsheet },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/content", label: "Site content", icon: PanelsTopLeft },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="scrollbar-none overflow-x-auto px-3 pb-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-sm px-3 py-2 text-sm",
                  active ? "bg-ink-strong text-white" : "hover:bg-surface-alt",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/server/auth";
import { storeStatus } from "@/lib/server/database";
import { logout } from "@/app/actions/admin-auth";
import { Logo } from "@/components/ui/Logo";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const store = storeStatus();
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-5 md:h-5" />
            <span className="font-extended text-[10px] text-muted">Admin</span>
          </Link>
        </div>
        <AdminNav />
        <div className="hidden px-5 py-6 text-xs text-muted lg:block">
          <p className="truncate">Signed in as {session.email}</p>
          <form action={logout} className="mt-2">
            <button type="submit" className="flex items-center gap-1 underline">
              <LogOut aria-hidden className="size-3.5" /> Sign out
            </button>
          </form>
          <Link href="/" target="_blank" className="mt-4 flex items-center gap-1 underline">
            View website <ExternalLink aria-hidden className="size-3" />
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        {!store.writable ? (
          <div role="status" className="border-b border-warning/30 bg-warning-bg px-5 py-3 text-sm text-warning">
            <strong>Read-only mode:</strong> persistent storage is not configured, so changes cannot be saved. The site is
            showing the bundled catalogue. Add the Supabase settings from README.md to enable editing.
          </div>
        ) : store.kind === "local" ? (
          <div role="status" className="border-b border-warning/30 bg-warning-bg px-5 py-3 text-sm text-warning">
            <strong>Local development store:</strong> changes are saved to <code>.data/</code> on this computer only. Do not
            use this mode for the live website.
          </div>
        ) : null}
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
        <form action={logout} className="px-4 pb-8 lg:hidden">
          <button type="submit" className="btn btn-secondary btn-sm">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

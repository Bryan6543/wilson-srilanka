import Link from "next/link";
import { AlertTriangle, Loader2, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-16 text-center", className)}>
      <SearchX aria-hidden className="mb-4 size-10 text-muted" strokeWidth={1.25} />
      <h2 className="text-xl font-bold">{title}</h2>
      {body && <p className="mt-2 max-w-md text-muted">{body}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-16 text-center">
      <AlertTriangle aria-hidden className="mb-4 size-10 text-accent" strokeWidth={1.25} />
      <h2 className="text-xl font-bold">{title}</h2>
      {body && <p className="mt-2 max-w-md text-muted">{body}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-muted">
      <Loader2 aria-hidden className="size-5 animate-spin" />
      <span>{label}…</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading products" className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] bg-surface-alt" />
          <div className="mt-4 h-3 w-1/3 bg-surface-alt" />
          <div className="mt-2 h-4 w-3/4 bg-surface-alt" />
          <div className="mt-2 h-4 w-1/4 bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-line bg-surface-alt text-ink",
    warning: "border-warning/30 bg-warning-bg text-warning",
    error: "border-error/30 bg-error-bg text-error",
    success: "border-success/30 bg-success-bg text-success",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-sm border px-4 py-3 text-sm", tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && "mt-1")}>{children}</div>
    </div>
  );
}

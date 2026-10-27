import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div className="container-site flex flex-col items-center py-24 text-center">
      <p className="font-extended text-xs text-muted">Error 404</p>
      <h1 className="font-display mt-3 text-6xl md:text-8xl">Out of bounds</h1>
      <p className="mt-4 max-w-md text-ink-soft">
        We couldn’t find that page. The product may have been removed, or the link may be wrong.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn btn-primary">
          Browse products
        </Link>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}

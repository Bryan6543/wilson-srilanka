import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="Wilson Sri Lanka home">
        <Logo />
      </Link>
      <p className="font-extended mt-12 text-xs text-muted">Error 404</p>
      <h1 className="font-display mt-3 text-6xl md:text-8xl">Out of bounds</h1>
      <p className="mt-4 max-w-md text-ink-soft">We couldn’t find that page.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn btn-primary">
          Browse products
        </Link>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </main>
  );
}

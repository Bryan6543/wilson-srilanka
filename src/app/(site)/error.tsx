"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/States";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-site">
      <ErrorState
        title="Something went wrong"
        body="We couldn’t load this page right now. Please try again in a moment."
      >
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </ErrorState>
      {error.digest && <p className="pb-8 text-center text-xs text-muted">Reference: {error.digest}</p>}
    </div>
  );
}

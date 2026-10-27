"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") setStatus("error");
    }
  }

  return (
    <div>
      <button type="button" onClick={share} className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
        {status === "copied" ? <Check aria-hidden className="size-4" /> : <Share2 aria-hidden className="size-4" />}
        {status === "copied" ? "Link copied" : "Share"}
      </button>
      <span role="status" className="sr-only">
        {status === "copied" ? "Link copied to clipboard" : status === "error" ? "Could not share this page" : ""}
      </span>
    </div>
  );
}

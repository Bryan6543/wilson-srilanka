"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type FormState } from "@/app/actions/public";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, { status: "idle" });
  const error = state.fieldErrors?.email ?? (state.status === "error" ? state.message : undefined);
  return (
    <form action={action} noValidate className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-invalid={!!error}
          aria-describedby="newsletter-status"
          className="h-12 flex-1 rounded-sm border border-white/40 bg-transparent px-4 text-white placeholder:text-white/50 focus-visible:border-white"
        />
        {/* Honeypot field for bots — hidden from people and assistive tech. */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button type="submit" className="btn btn-light" disabled={pending}>
          {pending ? "Signing up…" : "Sign up"}
        </button>
      </div>
      <p id="newsletter-status" aria-live="polite" className="mt-2 min-h-5 text-sm">
        {state.status === "success" ? <span className="text-white">{state.message}</span> : error && <span className="text-[#ffb4ab]">{error}</span>}
      </p>
    </form>
  );
}

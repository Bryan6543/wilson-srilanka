"use client";

import { useActionState } from "react";
import { sendContactMessage, type FormState } from "@/app/actions/public";
import { Notice } from "@/components/ui/States";

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  required = true,
  textarea = false,
  error,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  textarea?: boolean;
  error?: string;
  hint?: string;
}) {
  const id = `contact-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    required,
    autoComplete,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    className: "field-input",
  };
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {!required && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {textarea ? <textarea rows={6} {...common} /> : <input type={type} {...common} />}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, { status: "idle" });
  const fe = state.fieldErrors ?? {};

  if (state.status === "success") {
    return <Notice tone="success" title="Message sent">{state.message}</Notice>;
  }

  return (
    <form action={action} noValidate className="space-y-5">
      {!enabled && (
        <Notice tone="info" title="Online messages are currently unavailable">
          Please call or email the store using the details on this page.
        </Notice>
      )}
      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Name" autoComplete="name" error={fe.name} />
        <Field name="email" label="Email" type="email" autoComplete="email" error={fe.email} />
      </div>
      <Field name="phone" label="Phone" type="tel" autoComplete="tel" required={false} error={fe.phone} />
      <Field name="subject" label="Subject" error={fe.subject} />
      <Field name="message" label="Message" textarea error={fe.message} hint="Product questions, stock, stringing — we're happy to help." />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending || !enabled}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

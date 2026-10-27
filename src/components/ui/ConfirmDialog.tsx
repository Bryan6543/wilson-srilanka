"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Accessible confirmation dialog built on the native <dialog> element (modal focus
 * containment, Escape to close, focus restored to the trigger on close).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={body ? bodyId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md p-0 shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {body && (
          <div id={bodyId} className="mt-2 text-sm text-muted">
            {body}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

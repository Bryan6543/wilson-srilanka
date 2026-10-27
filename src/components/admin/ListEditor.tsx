"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

/** Generic editable list with add / remove / reorder, keyboard and screen-reader friendly. */
export function ListEditor<T>({
  label,
  items,
  onChange,
  makeEmpty,
  renderRow,
  addLabel = "Add",
  max = 60,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  makeEmpty: () => T;
  renderRow: (item: T, index: number, update: (next: T) => void) => React.ReactNode;
  addLabel?: string;
  max?: number;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next);
  };
  return (
    <div>
      {items.length > 0 && (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">{renderRow(item, i, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}</div>
              <div className="flex shrink-0 pt-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="p-2 disabled:opacity-30" aria-label={`Move ${label} ${i + 1} up`}>
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === items.length - 1}
                  className="p-2 disabled:opacity-30"
                  aria-label={`Move ${label} ${i + 1} down`}
                >
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="p-2 text-error"
                  aria-label={`Remove ${label} ${i + 1}`}
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={() => onChange([...items, makeEmpty()])}
        disabled={items.length >= max}
        className="btn btn-secondary btn-sm mt-3"
      >
        <Plus aria-hidden className="size-3.5" /> {addLabel}
      </button>
    </div>
  );
}

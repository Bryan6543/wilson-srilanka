"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw, Upload } from "lucide-react";
import { importCsvAction, syncRetailerAction } from "@/app/actions/admin";
import type { ImportReport, SyncReport } from "@/lib/server/products";
import { Notice } from "@/components/ui/States";

export function CsvImporter({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string; report?: ImportReport } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 5_000_000) {
      setResult({ ok: false, message: "The file is larger than 5 MB. Split it into smaller files." });
      return;
    }
    startTransition(async () => {
      const text = await file.text();
      const res = await importCsvAction(text);
      setResult(res.ok ? { ok: !res.data?.errors.length, message: res.message, report: res.data } : { ok: false, message: res.error });
      if (res.ok && !res.data?.errors.length) router.refresh();
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="csv-file" className="sr-only">
          CSV file
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          disabled={disabled || pending}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="text-sm file:mr-3 file:rounded-sm file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!file || disabled || pending}>
          <Upload aria-hidden className="size-4" /> {pending ? "Importing…" : "Import"}
        </button>
      </div>
      <div aria-live="polite" className="mt-4">
        {result && (
          <Notice tone={result.ok ? "success" : "error"} title={result.message}>
            {result.report && result.report.errors.length > 0 && (
              <ul className="mt-2 max-h-72 list-disc space-y-1 overflow-y-auto pl-5">
                {result.report.errors.map((e) => (
                  <li key={`${e.row}-${e.name}`}>
                    Row {e.row} ({e.name}): {e.message}
                  </li>
                ))}
              </ul>
            )}
          </Notice>
        )}
      </div>
    </form>
  );
}

export function RetailerSync({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string; report?: SyncReport } | null>(null);
  return (
    <div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await syncRetailerAction();
            setResult(res.ok ? { ok: true, message: res.message ?? "Done.", report: res.data } : { ok: false, message: res.error });
            if (res.ok) router.refresh();
          })
        }
      >
        <RefreshCw aria-hidden className={pending ? "size-4 animate-spin" : "size-4"} />
        {pending ? "Syncing…" : "Sync prices & stock now"}
      </button>
      <div aria-live="polite" className="mt-4">
        {result && (
          <Notice tone={result.ok ? "success" : "error"} title={result.message}>
            {result.report && result.report.notInFeed > 0 && (
              <p>
                {result.report.notInFeed} previously imported product(s) are no longer in the retailer feed. Review them and
                unpublish them if they are discontinued.
              </p>
            )}
          </Notice>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SiteContent } from "@/types/product";
import { saveSiteContentAction } from "@/app/actions/admin";
import { Notice } from "@/components/ui/States";
import { SafeImage } from "@/components/ui/SafeImage";
import { isTrustedImageSrc } from "@/lib/validation";

type Path = string;

function get(obj: unknown, path: Path): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
}
function setIn<T>(obj: T, path: Path, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const o = obj as Record<string, unknown>;
  return { ...o, [head!]: rest.length ? setIn(o[head!], rest.join("."), value) : value } as T;
}

export function SiteContentEditor({ content, canSave }: { content: SiteContent; canSave: boolean }) {
  const router = useRouter();
  const [c, setC] = useState(content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const text = (path: Path, label: string, opts: { area?: boolean; hint?: string } = {}) => {
    const id = `sc-${path.replace(/\./g, "-")}`;
    const value = (get(c, path) as string | undefined) ?? "";
    const common = {
      id,
      value,
      className: "field-input",
      "aria-invalid": !!errors[path],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC(setIn(c, path, e.target.value)),
    };
    return (
      <div>
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {opts.area ? <textarea rows={3} {...common} /> : <input {...common} />}
        {opts.hint && !errors[path] && <p className="field-hint">{opts.hint}</p>}
        {errors[path] && <p className="field-error">{errors[path]}</p>}
      </div>
    );
  };

  const [uploading, setUploading] = useState<string | null>(null);
  /** Uploads through the secure admin endpoint (re-encoded, metadata stripped) and sets the field. */
  const upload = async (path: Path, file: File | undefined) => {
    if (!file) return;
    setUploading(path);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { src?: string; error?: string };
      if (!res.ok || !data.src) throw new Error(data.error ?? "Upload failed");
      setC((prev) => setIn(prev, path, data.src));
      setErrors((e) => ({ ...e, [path]: "" }));
    } catch (err) {
      setErrors((e) => ({ ...e, [path]: (err as Error).message }));
    } finally {
      setUploading(null);
    }
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveSiteContentAction(c);
      if (res.ok) {
        setErrors({});
        setMsg({ tone: "success", text: "Saved — the website now shows these changes." });
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        setMsg({ tone: "error", text: res.error });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const card = "rounded-md bg-white p-5 shadow-sm md:p-6 space-y-4";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-6"
    >
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <section className={card}>
        <h2 className="text-lg font-bold">Announcement bar</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={c.announcement.enabled}
            onChange={(e) => setC(setIn(c, "announcement.enabled", e.target.checked))}
          />
          Show announcement bar
        </label>
        {text("announcement.text", "Message", { hint: "Write {maxDiscount} to insert the current best offer % automatically, e.g. “up to {maxDiscount}% off”. The bar hides itself when no offers are running." })}
        {text("announcement.href", "Link (optional)", { hint: "An internal page, e.g. /category/tennis-rackets" })}
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Sale banner photo</h2>
        <p className="text-sm text-muted">
          The photo on the first homepage banner (“Wilson — up to X% off”). Only use photos you have the rights to. A photo of a
          player suggests that player endorses Wilson, so use Wilson-sponsored athletes or official Wilson campaign images.
        </p>
        <div className="relative aspect-[16/10] max-w-md overflow-hidden bg-surface-alt">
          <SafeImage
            src={isTrustedImageSrc(c.saleBanner.image) ? c.saleBanner.image : null}
            alt=""
            fill
            sizes="450px"
            className="object-cover"
          />
        </div>
        <div>
          <input
            id="sale-banner-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={!canSave || uploading !== null}
            onChange={(e) => upload("saleBanner.image", e.target.files?.[0])}
          />
          <label
            htmlFor="sale-banner-file"
            className={`btn btn-secondary btn-sm ${!canSave || uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            {uploading === "saleBanner.image" ? "Uploading…" : "Upload a new photo"}
          </label>
          <p className="field-hint">Portrait or square photos work best (at least 1000 px). Then press Save.</p>
        </div>
        {text("saleBanner.image", "Photo address", { hint: "Filled in automatically after uploading." })}
        {text("saleBanner.imageAlt", "Photo description (alt text)", { hint: "Describe the photo for people using screen readers." })}
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Homepage banner (shown when no sale is running)</h2>
        <div className="relative aspect-[3/1] overflow-hidden bg-surface-alt">
          {/* Only preview addresses next/image is allowed to load; others are rejected on save. */}
          <SafeImage src={isTrustedImageSrc(c.hero.image) ? c.hero.image : null} alt="" fill sizes="800px" className="object-cover" />
        </div>
        {text("hero.image", "Image", { hint: "A /images/… path or an image URL from the trusted image servers (wide, at least 1920 px)" })}
        {text("hero.imageAlt", "Image description (alt text)")}
        {text("hero.eyebrow", "Small heading")}
        {text("hero.title", "Headline")}
        {text("hero.subtitle", "Subheading", { area: true })}
        <div className="grid gap-4 md:grid-cols-2">
          {text("hero.ctaLabel", "Button label")}
          {text("hero.ctaHref", "Button link", { hint: "e.g. /category/tennis-rackets" })}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Homepage spotlight</h2>
        {text("spotlight.image", "Image")}
        {text("spotlight.imageAlt", "Image description (alt text)")}
        {text("spotlight.title", "Title")}
        {text("spotlight.body", "Text", { area: true })}
        <div className="grid gap-4 md:grid-cols-2">
          {text("spotlight.ctaLabel", "Button label")}
          {text("spotlight.ctaHref", "Button link")}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Contact details</h2>
        {text("contact.retailerName", "Business name")}
        {text("contact.address", "Address")}
        <div>
          <label htmlFor="sc-phones" className="field-label">
            Phone numbers
          </label>
          <input
            id="sc-phones"
            className="field-input"
            value={c.contact.phones.join(", ")}
            onChange={(e) =>
              setC(setIn(c, "contact.phones", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)))
            }
          />
          <p className="field-hint">Separate numbers with commas.</p>
          {Object.entries(errors)
            .filter(([k]) => k.startsWith("contact.phones"))
            .map(([k, m]) => (
              <p key={k} className="field-error">
                {m}
              </p>
            ))}
        </div>
        {text("contact.email", "Email")}
        {text("contact.hours", "Opening hours (optional)")}
        <div className="grid gap-4 md:grid-cols-2">
          {text("contact.facebook", "Facebook URL")}
          {text("contact.instagram", "Instagram URL")}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Footer</h2>
        {text("footerNote", "Footer note", { area: true })}
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-white px-4 py-3 md:-mx-8 md:px-8">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !canSave}>
          {pending ? "Saving…" : "Save site content"}
        </button>
      </div>
    </form>
  );
}

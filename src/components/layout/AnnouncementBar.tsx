import Link from "next/link";
import type { SiteContent } from "@/types/product";

/** The text may contain {maxDiscount}, filled with the current best offer percentage. */
export function AnnouncementBar({
  announcement,
  maxDiscount,
}: {
  announcement: SiteContent["announcement"];
  maxDiscount?: number;
}) {
  if (!announcement.enabled || !announcement.text) return null;
  if (announcement.text.includes("{maxDiscount}") && maxDiscount === undefined) return null; // no offers running
  const message = announcement.text.replaceAll("{maxDiscount}", String(maxDiscount ?? ""));
  const text = <span className="font-extended text-[11px] tracking-[0.08em]">{message}</span>;
  return (
    <div className={`on-dark px-4 py-2 text-center text-white ${maxDiscount !== undefined && announcement.text.includes("{maxDiscount}") ? "bg-accent" : "bg-ink-strong"}`}>
      {announcement.href ? (
        <Link href={announcement.href} className="hover:underline">
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}

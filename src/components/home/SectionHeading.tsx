import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="font-extended mb-2 text-[11px] text-muted">{eyebrow}</p>}
        <h2 id={id} className="font-display text-4xl md:text-6xl">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="group flex shrink-0 items-center gap-2 pb-1 text-sm font-semibold">
          <span className="link-underline">{action.label}</span>
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

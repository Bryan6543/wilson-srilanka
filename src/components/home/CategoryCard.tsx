import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";

export function CategoryCard({
  href,
  name,
  count,
  image,
}: {
  href: string;
  name: string;
  count: number;
  image?: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-square overflow-hidden bg-surface-warm">
        <SafeImage
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-sm font-semibold group-hover:underline">{name}</p>
      <p className="text-xs text-muted">
        {count} {count === 1 ? "product" : "products"}
      </p>
    </Link>
  );
}

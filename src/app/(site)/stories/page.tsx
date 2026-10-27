import type { Metadata } from "next";
import Link from "next/link";
import { publishedStories } from "@/data/stories";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SafeImage } from "@/components/ui/SafeImage";

export const metadata: Metadata = {
  title: "Stories",
  description: "Wilson heritage and brand stories.",
  alternates: { canonical: "/stories" },
};

export default function StoriesPage() {
  const stories = publishedStories();
  return (
    <div className="container-site pt-6">
      <Breadcrumbs items={[{ label: "Stories", href: "/stories" }]} />
      <h1 className="font-display mt-6 text-5xl md:text-7xl">Stories</h1>
      <ul className="mt-12 grid gap-10 md:grid-cols-2">
        {stories.map((s) => (
          <li key={s.slug}>
            <Link href={`/stories/${s.slug}`} className="group block">
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-alt">
                <SafeImage
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <h2 className="mt-4 text-2xl font-bold group-hover:underline">{s.title}</h2>
              <p className="mt-2 text-ink-soft">{s.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

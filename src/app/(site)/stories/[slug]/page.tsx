import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedStories } from "@/data/stories";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SafeImage } from "@/components/ui/SafeImage";

// Only published stories exist as routes; drafts 404 and are never indexed.
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedStories().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = publishedStories().find((x) => x.slug === slug);
  if (!s) return { title: "Story not found" };
  return {
    title: s.title,
    description: s.excerpt,
    alternates: { canonical: `/stories/${s.slug}` },
    openGraph: { type: "article", images: [{ url: s.image, alt: s.imageAlt }] },
  };
}

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = publishedStories().find((s) => s.slug === slug);
  if (!story) notFound();
  return (
    <article>
      <div className="container-site pt-6">
        <Breadcrumbs
          items={[
            { label: "Stories", href: "/stories" },
            { label: story.title, href: `/stories/${story.slug}` },
          ]}
        />
      </div>
      <header className="container-site mt-8 max-w-4xl">
        <h1 className="font-display text-5xl md:text-7xl">{story.title}</h1>
        <p className="mt-4 text-lg text-ink-soft">{story.excerpt}</p>
      </header>
      <div className="container-site mt-10">
        <div className="relative aspect-[21/9] overflow-hidden bg-surface-alt">
          <SafeImage src={story.image} alt={story.imageAlt} fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>
      <div className="container-site mt-12 max-w-3xl">
        <div className="prose-wilson text-lg leading-relaxed text-ink-soft">
          {story.body.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
        <aside className="mt-12 border-t border-line-soft pt-6 text-sm">
          <h2 className="font-extended text-[11px]">Sources</h2>
          <ul className="mt-3 space-y-1">
            {story.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <Link href="/stories" className="link-underline mt-10 inline-block text-sm font-semibold">
          ← All stories
        </Link>
      </div>
    </article>
  );
}

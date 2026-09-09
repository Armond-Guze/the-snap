import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site-config';
import { sanityFetchDynamic } from '@/sanity/lib/fetch';
import { tagsQuery } from '@/sanity/lib/queries';
import type { Tag } from '@/types';
import { createWebsitePageMetadata } from '@/lib/seo';

type TagWithCount = Tag & { articleCount: number };

export const revalidate = 3600;

export const metadata: Metadata = createWebsitePageMetadata({
  title: 'NFL Topics and Tags | The Snap',
  description: 'Browse The Snap NFL reporting, analysis, rankings, and fantasy coverage by canonical topic.',
  canonicalUrl: `${SITE_URL}/tags`,
});

function tagClass(count: number, featured = false) {
  if (featured) return 'border-emerald-300/40 bg-emerald-300/10 text-emerald-50 hover:bg-emerald-300/15';
  if (count >= 5) return 'border-sky-300/30 bg-sky-300/10 text-sky-50 hover:bg-sky-300/15';
  return 'border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.08]';
}

export default async function TagsPage() {
  const tags = await sanityFetchDynamic<TagWithCount[]>(tagsQuery, {}, 3600, []);
  const populatedTags = tags.filter((tag) => tag.slug?.current && tag.articleCount > 0);
  const featured = populatedTags.slice(0, 12);
  const remaining = populatedTags.slice(12);

  return (
    <main className="min-h-screen bg-black px-6 py-14 text-white">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="text-sm text-white/50">
          <Link href="/" className="hover:text-white">Home</Link> <span aria-hidden="true">/</span> Topics
        </nav>
        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Topic directory</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Browse NFL coverage by topic</h1>
          <p className="mt-4 text-lg leading-8 text-white/65">
            These canonical topic pages collect related reporting and analysis under one stable URL.
          </p>
        </header>

        {featured.length > 0 && (
          <section className="mt-12" aria-labelledby="most-covered-topics">
            <h2 id="most-covered-topics" className="text-2xl font-bold">Most-covered topics</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {featured.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/tags/${encodeURIComponent(tag.slug.current)}`}
                  className={`rounded-xl border px-4 py-3 font-semibold transition ${tagClass(tag.articleCount, true)}`}
                >
                  #{tag.title} <span className="ml-1 text-xs opacity-65">{tag.articleCount}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {remaining.length > 0 && (
          <section className="mt-12" aria-labelledby="all-topics">
            <h2 id="all-topics" className="text-2xl font-bold">All topics</h2>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {remaining.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/tags/${encodeURIComponent(tag.slug.current)}`}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${tagClass(tag.articleCount)}`}
                >
                  #{tag.title} <span className="ml-1 text-xs opacity-60">{tag.articleCount}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {populatedTags.length === 0 && (
          <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/65">No populated topic pages are available yet.</p>
        )}
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

import StructuredData from '@/app/components/StructuredData';
import { buildPageMetadata } from '@/lib/page-metadata';
import { SITE_URL } from '@/lib/site-config';
import { client } from '@/sanity/lib/client';

export const revalidate = 600;

export const metadata: Metadata = buildPageMetadata({
  title: 'NFL Tags | Topics, Teams, and Coverage Hubs | The Snap',
  description:
    'Browse The Snap by NFL topic tags and team tags, including draft, fantasy football, free agency, power rankings, and team-specific coverage.',
  path: '/tags',
});

type TagSummary = {
  _id: string;
  _type: 'advancedTag' | 'tag';
  title: string;
  slug?: { current?: string };
  description?: string;
  articleCount: number;
};

const tagSummaryQuery = `
{
  "topicTags": *[_type == "advancedTag" && defined(title)] | order(title asc) {
    _id,
    _type,
    title,
    slug,
    description,
    "articleCount": count(*[
      published == true &&
      _type in ["article", "headline", "rankings", "fantasyFootball"] &&
      (
        (defined(tagRefs) && references(^._id)) ||
        (defined(tags) && tags match "*" + ^.title + "*")
      )
    ])
  },
  "teamTags": *[_type == "tag" && defined(title)] | order(title asc) {
    _id,
    _type,
    title,
    slug,
    description,
    "articleCount": count(*[
      published == true &&
      _type in ["article", "headline", "rankings", "fantasyFootball"] &&
      (
        (defined(teams) && references(^._id)) ||
        (defined(tags) && tags match "*" + ^.title + "*")
      )
    ])
  }
}
`;

function tagSize(articleCount: number) {
  if (articleCount >= 20) return 'px-4 py-3 text-lg';
  if (articleCount >= 10) return 'px-4 py-2.5 text-base';
  if (articleCount >= 5) return 'px-3.5 py-2 text-sm';
  return 'px-3 py-1.5 text-sm';
}

function topicHref(tag: TagSummary) {
  return `/headlines?tag=${encodeURIComponent(tag.title)}`;
}

function teamHref(tag: TagSummary) {
  const slug = tag.slug?.current?.trim();
  return slug ? `/teams/${encodeURIComponent(slug)}` : topicHref(tag);
}

function TagPill({ tag, href, featured = false }: { tag: TagSummary; href: string; featured?: boolean }) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center gap-2 rounded-lg border font-semibold transition-colors',
        tagSize(tag.articleCount),
        featured
          ? 'border-white/20 bg-white text-black hover:bg-white/90'
          : 'border-white/10 bg-white/[0.04] text-white/85 hover:border-white/25 hover:bg-white/[0.08] hover:text-white',
      ].join(' ')}
      title={tag.description || `View ${tag.title} coverage`}
    >
      <span>{tag.title}</span>
      <span className={featured ? 'text-black/55' : 'text-white/45'}>{tag.articleCount}</span>
    </Link>
  );
}

export default async function TagsPage() {
  const { topicTags, teamTags } = await client.fetch<{
    topicTags: TagSummary[];
    teamTags: TagSummary[];
  }>(tagSummaryQuery);

  const activeTopicTags = topicTags.filter((tag) => tag.articleCount > 0);
  const highCoverageTags = activeTopicTags.filter((tag) => tag.articleCount >= 5);
  const moreTopicTags = activeTopicTags.filter((tag) => tag.articleCount < 5);
  const activeTeamTags = teamTags.filter((tag) => tag.articleCount > 0);
  const itemListTags = [...highCoverageTags, ...moreTopicTags].slice(0, 30);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'NFL Topic Tags',
    itemListElement: itemListTags.map((tag, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tag.title,
      url: `${SITE_URL}${topicHref(tag)}`,
    })),
  };

  return (
    <main className="min-h-screen bg-black py-12 text-white">
      <StructuredData id="sd-tags-itemlist" data={itemListSchema} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Tags</p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">NFL Tags</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-300">
            Browse The Snap by recurring NFL topics, team tags, and coverage areas.
          </p>
        </header>

        <nav className="mb-10 text-sm text-white/55" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <span className="mx-2 text-white/25">/</span>
          <span className="text-white">Tags</span>
        </nav>

        <div className="space-y-12">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">High Coverage Tags</h2>
                <p className="mt-1 text-sm text-white/50">Topics with the deepest current archive.</p>
              </div>
              <Link href="/headlines" className="hidden text-sm font-semibold text-white/65 hover:text-white sm:inline">
                Latest Headlines
              </Link>
            </div>
            {highCoverageTags.length ? (
              <div className="flex flex-wrap gap-3">
                {highCoverageTags.map((tag) => (
                  <TagPill key={tag._id} tag={tag} href={topicHref(tag)} featured />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
                No high coverage tags yet.
              </p>
            )}
          </section>

          {moreTopicTags.length ? (
            <section>
              <h2 className="mb-5 text-2xl font-semibold text-white">More Topic Tags</h2>
              <div className="flex flex-wrap gap-2.5">
                {moreTopicTags.map((tag) => (
                  <TagPill key={tag._id} tag={tag} href={topicHref(tag)} />
                ))}
              </div>
            </section>
          ) : null}

          {activeTeamTags.length ? (
            <section>
              <h2 className="mb-5 text-2xl font-semibold text-white">Team Tags</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeTeamTags.map((tag) => (
                  <Link
                    key={tag._id}
                    href={teamHref(tag)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <span className="block text-base font-semibold text-white">{tag.title}</span>
                    <span className="mt-1 block text-sm text-white/45">
                      {tag.articleCount} article{tag.articleCount === 1 ? '' : 's'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

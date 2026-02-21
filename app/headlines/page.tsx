import { client } from '@/sanity/lib/client';
import { headlineQuery, headlinesByCategoryQuery, headlinesByTagQuery, categoriesQuery } from '@/sanity/lib/queries';
import type { Category, HeadlineListItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import TagCloud from '../components/TagCloud';
import NewsletterSignup from '../components/NewsletterSignup';
import MostRead from '../components/MostRead';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'NFL Headlines – Latest News & Breaking Stories | The Snap',
  description: 'Discover the latest NFL news, breaking stories, and fan-driven analysis for all 32 teams. Fast updates without the fluff.',
  alternates: { canonical: '/headlines' },
  openGraph: {
    title: 'NFL Headlines – Latest News & Breaking Stories | The Snap',
    description: 'Fresh NFL news and analysis across all 32 teams, fan-first with no corporate spin.',
    url: `${SITE_URL}/headlines`,
    type: 'website',
  },
};

export const revalidate = 120;

interface HeadlinesPageProps {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    search?: string | string[];
  }>;
}

type TagLike = { title?: string } | string | null | undefined;

function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    const candidate = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
    return candidate?.trim();
  }

  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function formatDate(date?: string) {
  if (!date || Number.isNaN(new Date(date).getTime())) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function titleCaseFromSlug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeTagTitles(tags: unknown, limit = 3): string[] {
  if (!Array.isArray(tags)) return [];

  const normalized = tags
    .map((entry: TagLike) => {
      if (typeof entry === 'string') return entry.trim();
      if (entry && typeof entry === 'object' && typeof entry.title === 'string') return entry.title.trim();
      return '';
    })
    .filter((entry) => entry.length > 0);

  return [...new Set(normalized)].slice(0, limit);
}

function getHeadlineImage(item: HeadlineListItem): string | null {
  return item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url || null;
}

function getHeadlineHref(item: HeadlineListItem): string {
  const slug = item.slug?.current?.trim();
  if (!slug) return '/headlines';

  if (item._type === 'article' || item._type === 'rankings') {
    return `/articles/${slug}`;
  }

  return `/headlines/${slug}`;
}

function buildTitle(filters: { category?: string; tag?: string; search?: string }) {
  if (filters.search) return `Search Results for "${filters.search}"`;
  if (filters.category) return `${titleCaseFromSlug(filters.category)} Headlines`;
  if (filters.tag) return `${titleCaseFromSlug(filters.tag)} Headlines`;
  return 'NFL Headlines';
}

function buildDescription(filters: { category?: string; tag?: string; search?: string }) {
  if (filters.search) return `Showing stories that match "${filters.search}" from around the league.`;
  if (filters.category) return `Latest NFL headlines in ${filters.category.replace(/-/g, ' ')}.`;
  if (filters.tag) return `Latest stories tagged with ${filters.tag}.`;
  return 'Breaking NFL news, instant analysis, and daily storylines in one live feed.';
}

async function fetchHeadlines(filters: { category?: string; tag?: string; search?: string }): Promise<HeadlineListItem[]> {
  if (filters.search) {
    const searchPattern = `*${filters.search}*`;
    return client.fetch<HeadlineListItem[]>(
      `
      *[
        (( _type == "article" && format == "headline" ) || _type == "headline" || _type == "rankings") &&
        published == true && (
          title match $searchPattern ||
          summary match $searchPattern ||
          category->title match $searchPattern ||
          author->name match $searchPattern ||
          rankingType match $searchPattern
        )
      ]
      | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...40] {
        _id,
        _type,
        title,
        homepageTitle,
        slug,
        summary,
        coverImage { asset->{ url } },
        featuredImage { asset->{ url } },
        image { asset->{ url } },
        date,
        publishedAt,
        rankingType,
        author->{ name },
        category->{ title, slug, color },
        tags[]->{ title }
      }
      `,
      { searchPattern }
    );
  }

  if (filters.category) {
    return client.fetch<HeadlineListItem[]>(headlinesByCategoryQuery, { categorySlug: filters.category });
  }

  if (filters.tag) {
    return client.fetch<HeadlineListItem[]>(headlinesByTagQuery, { tagTitle: filters.tag });
  }

  return client.fetch<HeadlineListItem[]>(headlineQuery);
}

function ActiveFilterPill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs font-medium text-white/85 transition-colors hover:bg-white/[0.14]"
    >
      <span>{label}</span>
      <span className="text-white/60">Clear</span>
    </Link>
  );
}

export default async function HeadlinesPage(props: HeadlinesPageProps) {
  const searchParams = await props.searchParams;
  const filters = {
    category: toSingleParam(searchParams.category),
    tag: toSingleParam(searchParams.tag),
    search: toSingleParam(searchParams.search),
  };

  const [headlines, categories] = await Promise.all([
    fetchHeadlines(filters),
    client.fetch<Category[]>(categoriesQuery),
  ]);

  const title = buildTitle(filters);
  const description = buildDescription(filters);
  const leadStory = headlines[0];
  const secondaryStories = headlines.slice(1, 4);
  const gridStories = headlines.slice(4, 28);

  const hasFilters = Boolean(filters.category || filters.tag || filters.search);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.10),_transparent_40%),linear-gradient(180deg,_#0b0b0c_0%,_#050506_100%)] text-white">
      <div className="mx-auto max-w-[92rem] px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-6 shadow-[0_25px_90px_-45px_rgba(56,189,248,0.5)] md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.18),transparent_45%)]" />
          <div className="relative z-10">
            <p className="mb-3 inline-flex items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
              Live Feed
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm text-slate-200/90 sm:text-base md:text-lg">{description}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <form action="/headlines" method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search ?? ''}
                  placeholder="Search headlines, teams, tags..."
                  className="h-11 w-full rounded-xl border border-white/15 bg-black/35 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/45 focus:border-sky-300/45"
                />
                {filters.category && <input type="hidden" name="category" value={filters.category} />}
                {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-slate-100"
                >
                  Search
                </button>
              </form>

              <div className="text-left text-xs text-white/60 md:text-right">{headlines.length} stories loaded</div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/headlines"
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  hasFilters
                    ? 'border border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.11]'
                    : 'border border-white/25 bg-white/15 text-white'
                }`}
              >
                All Headlines
              </Link>

              {(categories || []).slice(0, 8).map((category) => {
                const active = filters.category === category.slug.current;
                return (
                  <Link
                    key={category._id}
                    href={`/headlines?category=${encodeURIComponent(category.slug.current)}`}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'border border-sky-300/45 bg-sky-300/20 text-sky-100'
                        : 'border border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.11]'
                    }`}
                  >
                    {category.title}
                  </Link>
                );
              })}
            </div>

            {hasFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.search && <ActiveFilterPill label={`Search: ${filters.search}`} href="/headlines" />}
                {filters.category && (
                  <ActiveFilterPill label={`Category: ${titleCaseFromSlug(filters.category)}`} href="/headlines" />
                )}
                {filters.tag && <ActiveFilterPill label={`Tag: ${filters.tag}`} href="/headlines" />}
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
          <main>
            {headlines.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <h2 className="text-xl font-semibold text-white">No stories found</h2>
                <p className="mt-2 text-sm text-white/65">Try another keyword, category, or tag filter.</p>
                <Link
                  href="/headlines"
                  className="mt-5 inline-flex rounded-lg border border-white/20 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
                >
                  Reset Filters
                </Link>
              </div>
            ) : (
              <>
                {leadStory && (
                  <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                      <Link href={getHeadlineHref(leadStory)} className="group block">
                        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                          {getHeadlineImage(leadStory) ? (
                            <Image
                              src={getHeadlineImage(leadStory) || ''}
                              alt={leadStory.homepageTitle || leadStory.title}
                              fill
                              priority
                              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                              sizes="(min-width: 1280px) 70vw, 100vw"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                            <p className="mb-3 inline-flex rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">
                              Top Headline
                            </p>
                            <h2 className="text-2xl font-black leading-tight text-white transition-colors group-hover:text-sky-100 sm:text-3xl">
                              {leadStory.homepageTitle || leadStory.title}
                            </h2>
                            {leadStory.summary && (
                              <p className="mt-3 line-clamp-2 max-w-3xl text-sm text-slate-200/95 sm:text-base">
                                {leadStory.summary}
                              </p>
                            )}
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/75">
                              {leadStory.author?.name && <span>By {leadStory.author.name}</span>}
                              <span>{formatDate(leadStory.publishedAt || leadStory.date)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>

                    <div className="space-y-4">
                      {secondaryStories.map((story) => {
                        const image = getHeadlineImage(story);
                        return (
                          <article
                            key={story._id}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.06]"
                          >
                            <Link href={getHeadlineHref(story)} className="group block">
                              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 p-3">
                                <div className="relative h-[84px] overflow-hidden rounded-lg bg-zinc-900">
                                  {image ? (
                                    <Image
                                      src={image}
                                      alt={story.homepageTitle || story.title}
                                      fill
                                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                      sizes="110px"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-sky-100">
                                    {story.homepageTitle || story.title}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                                    {story.author?.name && <span>{story.author.name}</span>}
                                    <span>{formatDate(story.publishedAt || story.date)}</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white sm:text-2xl">Latest Around The NFL</h2>
                    <span className="text-xs uppercase tracking-[0.14em] text-white/55">Updated every 2 minutes</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {gridStories.map((story) => {
                      const image = getHeadlineImage(story);
                      const tags = normalizeTagTitles(story.tags);

                      return (
                        <article
                          key={story._id}
                          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.06]"
                        >
                          <Link href={getHeadlineHref(story)} className="group block">
                            <div className="relative aspect-video overflow-hidden bg-zinc-900">
                              {image ? (
                                <Image
                                  src={image}
                                  alt={story.homepageTitle || story.title}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                  sizes="(min-width: 1280px) 23vw, (min-width: 768px) 48vw, 100vw"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                              )}
                              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 text-[10px] uppercase tracking-[0.14em] text-white/75">
                                <span className="rounded-full bg-black/45 px-2 py-1">{story.category?.title || 'League'}</span>
                                <span>{formatDate(story.publishedAt || story.date)}</span>
                              </div>
                            </div>

                            <div className="p-4">
                              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-sky-100">
                                {story.homepageTitle || story.title}
                              </h3>

                              {story.summary && (
                                <p className="mt-2 line-clamp-2 text-sm text-white/70">{story.summary}</p>
                              )}

                              <p className="mt-3 text-xs text-white/55">{story.author?.name ? `By ${story.author.name}` : 'The Snap'}</p>
                            </div>
                          </Link>

                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                              {tags.map((tag) => (
                                <Link
                                  key={`${story._id}-${tag}`}
                                  href={`/headlines?tag=${encodeURIComponent(tag)}`}
                                  className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
                                >
                                  #{tag}
                                </Link>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  {!hasFilters && headlines.length > 28 && (
                    <div className="mt-6 text-center">
                      <Link
                        href="/headlines/page/2"
                        className="inline-flex items-center rounded-lg border border-white/20 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
                      >
                        Browse Older Headlines
                      </Link>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <TagCloud maxTags={16} activeTag={filters.tag} title="Team + Topic Radar" />
            </div>

            <NewsletterSignup variant="sidebar" />
            <MostRead limit={6} />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">Subscribe via RSS</h3>
              <p className="mt-2 text-sm text-white/65">Use your reader app and track every story in real time.</p>
              <a
                href="/rss.xml"
                className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-slate-100"
              >
                Open RSS Feed
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-3 text-base font-semibold text-white">Popular Categories</h3>
              <div className="space-y-1.5">
                {(categories || []).slice(0, 8).map((category) => (
                  <Link
                    key={category._id}
                    href={`/headlines?category=${encodeURIComponent(category.slug.current)}`}
                    className="block rounded-md px-2 py-1.5 text-sm text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

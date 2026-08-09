import { client } from '@/sanity/lib/client';
import { categoriesQuery } from '@/sanity/lib/queries';
import type { Category } from '@/types';
import type { HeadlineListItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import TagCloud from '../components/TagCloud';
import NewsletterSignup from '../components/NewsletterSignup';
import MostRead from '../components/MostRead';
import { SITE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 1800;

interface ArticlesPageProps {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    search?: string | string[];
    page?: string | string[];
  }>;
}

type ArticleFilters = {
  category?: string;
  tag?: string;
  search?: string;
};

const PAGE_SIZE = 24;

function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    const candidate = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
    return candidate?.trim();
  }

  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePageParam(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (Array.isArray(value) || !/^[1-9]\d*$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function articlesPageHref(page: number, filters: ArticleFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.search) params.set('search', filters.search);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return query ? `/articles?${query}` : '/articles';
}

function formatDate(date?: string) {
  if (!date || isNaN(new Date(date).getTime())) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type ArticleListItem = HeadlineListItem & {
  format?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
};

function normalizeArticleTags(tags: unknown): Array<{ title: string }> {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter(
      (tag): tag is { title: string } =>
        Boolean(tag) &&
        typeof tag === 'object' &&
        typeof (tag as { title?: unknown }).title === 'string'
    )
    .map((tag) => ({ title: tag.title.trim() }))
    .filter((tag) => tag.title.length > 0)
    .slice(0, 3);
}

async function fetchArticles(filters: ArticleFilters): Promise<ArticleListItem[]> {
  const baseFilter = 'published == true && (!defined(seo.noIndex) || seo.noIndex == false) && (_type == "rankings" || (_type == "article" && format != "headline"))';

  const baseFields = `{
    _id,_type,format,rankingType,seasonYear,weekNumber,playoffRound,title,homepageTitle,slug,summary,
    coverImage{asset->{url}},date,publishedAt,author->{name},category->{title,slug,color},"tags": coalesce(tagRefs[]->{title,slug}, [])
  }`;

  if (filters.search) {
    const searchPattern = `*${filters.search}*`;
    return client.fetch(
      `
      *[${baseFilter} && (
        title match $searchPattern ||
        summary match $searchPattern ||
        category->title match $searchPattern ||
        author->name match $searchPattern
      )] | order(_createdAt desc, publishedAt desc) ${baseFields}
      `,
      { searchPattern }
    );
  }

  if (filters.category) {
    return client.fetch(
      `
      *[${baseFilter} && category->slug.current == $categorySlug]
      | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc) ${baseFields}
      `,
      { categorySlug: filters.category }
    );
  }

  if (filters.tag) {
    return client.fetch(
      `
      *[${baseFilter} && (
        (defined(tags) && tags match "*" + $tagTitle + "*") ||
        (defined(tagRefs) && $tagTitle in tagRefs[]->title) ||
        (defined(teams) && $tagTitle in teams[]->title)
      )]
      | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc) ${baseFields}
      `,
      { tagTitle: filters.tag }
    );
  }

  return client.fetch(`*[$baseFilter] | order(_createdAt desc, coalesce(publishedAt, date) desc) ${baseFields}`.replace('$baseFilter', baseFilter));
}

function buildTitle(filters: ArticleFilters) {
  if (filters.search) return `Search Results for "${filters.search}"`;
  if (filters.category) return `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1).replace('-', ' ')} Articles`;
  if (filters.tag) return `${filters.tag.charAt(0).toUpperCase() + filters.tag.slice(1)} Articles`;
  return 'NFL Articles';
}

function buildDescription(filters: ArticleFilters) {
  if (filters.search) return `Showing articles matching "${filters.search}" from around the NFL.`;
  if (filters.category) return `Latest articles and analysis in ${filters.category.replace('-', ' ')}.`;
  if (filters.tag) return `Articles tagged with ${filters.tag}.`;
  return 'Discover long-form NFL articles, analysis, and deep dives.';
}

export async function generateMetadata(
  props: ArticlesPageProps
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const filters: ArticleFilters = {
    category: toSingleParam(searchParams.category),
    tag: toSingleParam(searchParams.tag),
    search: toSingleParam(searchParams.search),
  };
  const page = parsePageParam(searchParams.page);
  if (!page) {
    return {
      title: 'Articles Page Not Found | The Snap',
      robots: { index: false, follow: false },
    };
  }

  const hasFilters = Boolean(filters.category || filters.tag || filters.search);
  const baseTitle = hasFilters ? buildTitle(filters) : 'NFL Articles';
  const title = page > 1 ? `${baseTitle} – Page ${page} | The Snap` : `${baseTitle} | The Snap`;
  const description = hasFilters
    ? buildDescription(filters)
    : 'Long-form articles, deep dives, and analysis from around the NFL.';
  const canonicalPath = hasFilters ? '/articles' : articlesPageHref(page);
  const canonical = `${SITE_URL}${canonicalPath}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: !hasFilters,
      follow: true,
      googleBot: {
        index: !hasFilters,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function ArticlesPage(props: ArticlesPageProps) {
  const searchParams = await props.searchParams;
  const filters: ArticleFilters = {
    category: toSingleParam(searchParams.category),
    tag: toSingleParam(searchParams.tag),
    search: toSingleParam(searchParams.search),
  };
  const requestedPage = parsePageParam(searchParams.page);
  if (!requestedPage) notFound();

  const [articles, categories] = await Promise.all([
    fetchArticles(filters),
    client.fetch<Category[]>(categoriesQuery)
  ]);
  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  if (requestedPage > totalPages) notFound();

  const offset = (requestedPage - 1) * PAGE_SIZE;
  const pageArticles = articles.slice(offset, offset + PAGE_SIZE);
  const baseTitle = buildTitle(filters);
  const title = requestedPage > 1 ? `${baseTitle} – Page ${requestedPage}` : baseTitle;
  const description = buildDescription(filters);

  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
          <div className="w-24 h-1 bg-white mb-6" />
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">{description}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {articles.length === 0 ? (
              <p className="text-gray-400">No articles found.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pageArticles.map(f => {
                    const tags = normalizeArticleTags(f.tags);
                    return (
                      <article key={f._id} className="group rounded-lg overflow-hidden bg-[#0d0d0d] border border-[#1e1e1e] hover:bg-[#161616] hover:border-[#262626] transition-colors">
                        <Link href={getArticleHref(f)} className="block">
                        {f.coverImage?.asset?.url && (
                          <div className="aspect-video relative overflow-hidden bg-[#111]">
                            <Image src={f.coverImage.asset.url} alt={f.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {f.category?.title && (
                              <span className="inline-block px-2 py-1 text-[11px] font-medium text-gray-300 bg-gray-800 rounded-md border border-gray-700/60">{f.category.title}</span>
                            )}
                            {f._type === 'article' && f.format === 'powerRankings' && (
                              <span className="inline-block px-2 py-1 text-[11px] font-semibold text-purple-200 bg-purple-500/15 rounded-md border border-purple-400/30">
                                Power Rankings
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-[15px] group-hover:text-gray-300 transition-colors mb-2 line-clamp-2">{f.homepageTitle || f.title}</h3>
                          {f.summary && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{f.summary}</p>}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {f.author?.name && <span>By {f.author.name}</span>}
                            {f.date && <span>{formatDate(f.date)}</span>}
                          </div>
                        </div>
                        </Link>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 px-4 pb-4">
                            {tags.map((tag) => (
                              <Link
                                key={`${f._id}-${tag.title}`}
                                href={`/articles?tag=${encodeURIComponent(tag.title)}`}
                                className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                              >
                                #{tag.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <nav aria-label="Articles pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
                    {requestedPage > 1 ? (
                      <Link href={articlesPageHref(requestedPage - 1, filters)} className="rounded-md bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20">
                        Previous
                      </Link>
                    ) : (
                      <span aria-disabled="true" className="rounded-md bg-white/5 px-4 py-2 text-white/30">Previous</span>
                    )}
                    <span className="text-gray-400">Page {requestedPage} of {totalPages}</span>
                    {requestedPage < totalPages ? (
                      <Link href={articlesPageHref(requestedPage + 1, filters)} className="rounded-md bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20">
                        Next
                      </Link>
                    ) : (
                      <span aria-disabled="true" className="rounded-md bg-white/5 px-4 py-2 text-white/30">Next</span>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
              <TagCloud maxTags={15} />
            </div>
            <NewsletterSignup variant="sidebar" />
            <MostRead limit={6} />
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Subscribe via RSS</h3>
              <p className="text-sm text-gray-400 mb-4">Prefer feed readers? Follow our latest articles instantly.</p>
              <a href="/rss.xml" className="inline-block text-sm px-3 py-2 rounded bg-white text-black font-medium hover:bg-gray-200 transition-colors">RSS Feed →</a>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Popular Categories</h3>
              <div className="space-y-2">
                {(categories || []).slice(0,6).map(cat => (
                  <Link key={cat._id} href={`/articles?category=${encodeURIComponent(cat.slug.current)}`} className="block text-gray-300 hover:text-white transition-colors">
                    {cat.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getArticleHref(item: ArticleListItem) {
  if (item._type === 'article' && item.format === 'powerRankings') {
    if (item.rankingType === 'live') return '/articles/power-rankings';
    const season = item.seasonYear;
    const weekPart = item.playoffRound
      ? item.playoffRound.toLowerCase()
      : typeof item.weekNumber === 'number'
        ? `week-${item.weekNumber}`
        : null;
    if (season && weekPart) return `/articles/power-rankings/${season}/${weekPart}`;
    return '/articles/power-rankings';
  }
  return `/articles/${item.slug.current.trim()}`;
}

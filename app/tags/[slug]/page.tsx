import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StructuredData from '@/app/components/StructuredData';
import { SITE_URL } from '@/lib/site-config';
import { createWebsitePageMetadata } from '@/lib/seo';
import { sanityFetchDynamic } from '@/sanity/lib/fetch';

type Topic = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  articleCount: number;
};

type TopicArticle = {
  _id: string;
  _type: string;
  format?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
  title: string;
  homepageTitle?: string;
  slug: string;
  summary?: string;
  imageUrl?: string;
  imageAlt?: string;
  date?: string;
  author?: { name?: string; slug?: string };
  category?: { title?: string; slug?: string };
};

type TopicPageProps = { params: Promise<{ slug: string }> };

export const revalidate = 300;

const topicQuery = `*[_type == "advancedTag" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  description,
  "articleCount": count(*[_type == "article" && published == true && references(^._id)])
}`;

async function getTopic(slug: string) {
  return sanityFetchDynamic<Topic | null>(topicQuery, { slug }, 3600, null);
}

function articleHref(article: TopicArticle) {
  if (article.format === 'powerRankings') {
    if (article.rankingType !== 'snapshot') return '/articles/power-rankings';
    const period = article.playoffRound?.toLowerCase()
      || (typeof article.weekNumber === 'number' ? `week-${article.weekNumber}` : null);
    if (article.seasonYear && period) return `/articles/power-rankings/${article.seasonYear}/${period}`;
    return '/articles/power-rankings';
  }
  return `/articles/${article.slug}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return {};
  const title = `${topic.title} NFL News and Analysis | The Snap`;
  const description = topic.description || `Read the latest ${topic.title} NFL reporting, analysis, rankings, and related coverage from The Snap.`;
  const canonical = `${SITE_URL}/tags/${topic.slug}`;
  return {
    ...createWebsitePageMetadata({ title, description, canonicalUrl: canonical }),
    robots: { index: topic.articleCount > 0, follow: true },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) notFound();

  const articles = await sanityFetchDynamic<TopicArticle[]>(
    `*[_type == "article" && published == true && references($tagId)]
      | order(coalesce(dateModified, date, publishedAt, _createdAt) desc)[0...48]{
        _id,
        _type,
        format,
        rankingType,
        seasonYear,
        weekNumber,
        playoffRound,
        title,
        homepageTitle,
        "slug": slug.current,
        summary,
        "imageUrl": coverImage.asset->url,
        "imageAlt": coverImage.alt,
        "date": coalesce(date, publishedAt, _createdAt),
        author->{name,"slug":slug.current},
        category->{title,"slug":slug.current}
      }`,
    { tagId: topic._id },
    300,
    []
  );

  const canonical = `${SITE_URL}/tags/${topic.slug}`;
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: `${SITE_URL}/tags` },
      { '@type': 'ListItem', position: 3, name: topic.title, item: canonical },
    ],
  };
  const listData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${topic.title} coverage`,
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: article.title,
      url: `${SITE_URL}${articleHref(article)}`,
    })),
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-white">
      <StructuredData id={`sd-topic-breadcrumb-${topic.slug}`} data={breadcrumbData} />
      <StructuredData id={`sd-topic-list-${topic.slug}`} data={listData} />
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="text-sm text-white/50">
          <Link href="/" className="hover:text-white">Home</Link> <span aria-hidden="true">/</span>{' '}
          <Link href="/tags" className="hover:text-white">Topics</Link> <span aria-hidden="true">/</span>{' '}
          <span aria-current="page">{topic.title}</span>
        </nav>
        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">NFL topic</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{topic.title}</h1>
          <p className="mt-4 text-lg leading-8 text-white/65">
            {topic.description || `The latest ${topic.title} reporting and analysis from The Snap.`}
          </p>
          <p className="mt-3 text-sm text-white/40">{articles.length} {articles.length === 1 ? 'story' : 'stories'}</p>
        </header>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label={`${topic.title} articles`}>
          {articles.map((article) => (
            <article key={article._id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <Link href={articleHref(article)} className="group block h-full">
                {article.imageUrl && (
                  <div className="relative aspect-video overflow-hidden bg-white/5">
                    <Image src={article.imageUrl} alt={article.imageAlt || article.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition group-hover:scale-[1.03]" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">{article.category?.title || 'NFL'}</p>
                  <h2 className="mt-2 text-xl font-bold leading-snug group-hover:text-emerald-200">{article.homepageTitle || article.title}</h2>
                  {article.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">{article.summary}</p>}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/40">
                    {article.author?.name && <span>By {article.author.name}</span>}
                    {article.date && <time dateTime={article.date}>{formatDate(article.date)}</time>}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </section>
        {articles.length === 0 && <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/60">No published coverage is assigned to this topic yet.</p>}
      </div>
    </main>
  );
}

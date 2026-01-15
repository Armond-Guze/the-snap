import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AVATAR_SIZES, ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import { client } from '@/sanity/lib/client';
import type { Headline, HeadlineListItem, HeadlinePageProps } from '@/types';
import RelatedArticles from '@/app/components/RelatedArticles';
import SocialShare from '@/app/components/SocialShare';
import ReadingTime from '@/app/components/ReadingTime';
import Breadcrumb from '@/app/components/Breadcrumb';
import ArticleViewTracker from '@/app/components/ArticleViewTracker';
import { generateSEOMetadata } from '@/lib/seo';
import { headlineDetailQuery } from '@/sanity/lib/queries';
import { calculateReadingTime, extractTextFromBlocks } from '@/lib/reading-time';
import { formatArticleDate } from '@/lib/date-utils';
import { portableTextComponents } from '@/lib/portabletext-components';
import { Metadata } from 'next';
import StructuredData, { createEnhancedArticleStructuredData } from '@/app/components/StructuredData';
import YouTubeEmbed from '@/app/components/YoutubeEmbed';
import TwitterEmbed from '@/app/components/TwitterEmbed';
import InstagramEmbed from '@/app/components/InstagramEmbed';
import TikTokEmbed from '@/app/components/TikTokEmbed';
import MostRead from '@/app/components/MostRead';

export const dynamic = "force-dynamic";

export async function generateMetadata(props: HeadlinePageProps): Promise<Metadata> {
  const params = await props.params;
  if (!params?.slug) return {};

  const trimmedSlug = decodeURIComponent(params.slug).trim();

  const headline = await client.fetch<Headline>(
    headlineDetailQuery,
    { slug: trimmedSlug }
  );

  if (!headline) return {};

  const metadata = generateSEOMetadata(headline, '/headlines');
  // Safety: enforce canonical exactly once (avoid double slash issues)
  const canonicalBase = 'https://thegamesnap.com/headlines';
  const cleanSlug = headline.slug?.current?.replace(/^\/+|\/+$/g, '') || params.slug;
  return {
    ...metadata,
    // Belt-and-suspenders: headlines route is legacy; keep it non-indexable even if hit directly
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      ...metadata.alternates,
      canonical: `${canonicalBase}/${cleanSlug}`,
    },
  };
}

export default async function HeadlinePage(props: HeadlinePageProps) {
  const params = await props.params;
  if (!params?.slug) return notFound();

  const trimmedSlug = decodeURIComponent(params.slug).trim();

  const [headline, otherHeadlines] = await Promise.all([
    client.fetch<Headline>(
      headlineDetailQuery,
      { slug: trimmedSlug }
    ),
    client.fetch<HeadlineListItem[]>(
      `*[
        ((_type == "article" && format == "headline") || _type == "headline") && published == true
      ] | order(_createdAt desc)[0...24]{
        _id,
        _type,
        title,
        homepageTitle,
        slug,
        date,
        summary,
        author-> { name },
        coverImage { asset->{ url } },
        featuredImage { asset->{ url } },
        image { asset->{ url } },
        category->{ title, slug, color },
        tags[]->{ title }
      }`
    ),
  ]);

  if (!headline) notFound();

  const tagList = Array.isArray(headline.tags)
    ? headline.tags
        .map((tag) => {
          const title = typeof tag?.title === 'string' ? tag.title.trim() : ''
          if (!title) return null
          const slug = tag?.slug?.current
          return typeof slug === 'string' && slug.length > 0 ? { title, slug } : { title }
        })
        .filter((tag): tag is { title: string; slug?: string } => tag !== null)
    : [];

  const categorySlug = headline.category?.slug?.current;
  const categoryMatches = categorySlug
    ? otherHeadlines
        .filter(
          (article) =>
            article.slug.current !== trimmedSlug &&
            article.category?.slug?.current === categorySlug
        )
        .slice(0, 3)
    : [];

  const trendingArticles = otherHeadlines
    .filter((article) => article.slug.current !== trimmedSlug)
    .slice(0, 5);

  // Calculate reading time
  const textContent = extractTextFromBlocks(headline.body || []);
  const readingTime = calculateReadingTime(textContent);

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Articles', href: '/articles' },
    ...(headline.category?.title ? [{ label: headline.category.title, href: `/categories/${headline.category.slug?.current}` }] : []),
    { label: headline.title }
  ];


  const shareUrl = `https://thegamesnap.com/headlines/${trimmedSlug}`;

  // Structured Data
  let articleSD; // wrap in try/catch to avoid hard crash
  try {
  // Safely derive keyword strings from tags; guard against null/invalid entries coming from Sanity
  const keywordList = Array.isArray(headline.tags)
    ? headline.tags
      .map(t => (t && typeof t.title === 'string' ? t.title.trim() : null))
      .filter((t): t is string => !!t && t.length > 0)
    : undefined;
    articleSD = createEnhancedArticleStructuredData({
      headline: headline.title,
      description: headline.summary || '',
      canonicalUrl: shareUrl,
      images: [
        ...(headline.coverImage?.asset?.url ? [{ url: headline.coverImage.asset.url }] : []),
      ],
      datePublished: headline.date,
      dateModified: (headline as unknown as { _updatedAt?: string })._updatedAt || headline.date,
      author: { name: headline.author?.name || 'Staff Writer' },
      articleSection: headline.category?.title,
    keywords: keywordList && keywordList.length ? keywordList : undefined,
      speakableSelectors: ['h1','meta[name="description"]'],
    });
  } catch (e) {
    console.error('Structured data generation failed', e);
  }

  return (
    <main className="bg-black text-white min-h-screen">
      {articleSD && <StructuredData id={`sd-article-${trimmedSlug}`} data={articleSD} />}
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Article */}
        <article className="lg:col-span-2 flex flex-col">
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
          </div>
          {/* Extend headline title width similar to fantasy article (remove strict 20ch max) */}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">{headline.title}</h1>
          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left flex-wrap">
            {headline.author?.image?.asset?.url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image src={headline.author.image.asset.url} alt={headline.author.name || 'Author'} fill sizes={AVATAR_SIZES} className="object-cover" />
              </div>
            )}
            {headline.author?.name && <span className="font-medium text-white/90">By {headline.author.name}</span>}
            <span>• {formatArticleDate(headline.date)}</span>
            <span className="text-gray-500">•</span>
            <ReadingTime minutes={readingTime} />
            {headline.category?.slug?.current && headline.category?.title && (
              <Link
                href={`/categories/${headline.category.slug.current}`}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/10 transition-colors"
              >
                {headline.category.title}
              </Link>
            )}
            {(headline as unknown as { _updatedAt?: string })._updatedAt && (headline as unknown as { _updatedAt?: string })._updatedAt !== headline.date && (
              <span className="text-xs text-gray-500">Updated {formatArticleDate((headline as unknown as { _updatedAt?: string })._updatedAt! )}</span>
            )}
          </div>
          {headline.coverImage?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image src={headline.coverImage.asset.url} alt={headline.title} fill sizes={ARTICLE_COVER_SIZES} className="object-cover w-full h-full" priority />
              </div>
              {headline.summary && (
                <p className="mt-4 text-lg text-gray-300 leading-relaxed max-w-3xl">{headline.summary}</p>
              )}
              {tagList.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <Link
                      key={tag.slug || tag.title}
                      href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 hover:border-white/30 hover:bg-white/15"
                    >
                      #{tag.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <section className="w-full mb-8">
            <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              {Array.isArray(headline.body) && <PortableText value={headline.body} components={portableTextComponents} />}
            </div>
          </section>
          {categoryMatches.length > 1 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">
                  More from {headline.category?.title}
                </h2>
                <Link
                  href={`/categories/${headline.category?.slug?.current}`}
                  className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  View category →
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {categoryMatches.map((article) => {
                  const img =
                    article.coverImage?.asset?.url ||
                    article.featuredImage?.asset?.url ||
                    article.image?.asset?.url ||
                    null;
                  return (
                    <Link
                      key={article._id}
                      href={`/headlines/${article.slug.current}`}
                      className="group rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm hover:border-white/30 hover:bg-white/10 transition-colors"
                    >
                      {img && (
                        <div className="relative mb-4 h-36 overflow-hidden rounded-xl">
                          <Image
                            src={img}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <p className="text-xs uppercase tracking-wide text-white/50 mb-2">
                        {formatArticleDate(article.date || article.publishedAt)}
                      </p>
                      <h3 className="text-lg font-semibold text-white leading-snug line-clamp-2">
                        {article.homepageTitle || article.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          {trendingArticles.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-white">
                  🔥
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Trending now</p>
                  <h2 className="text-2xl font-semibold text-white">What readers are clicking</h2>
                </div>
              </div>
              <ol className="space-y-3">
                {trendingArticles.map((article, index) => (
                  <li key={article._id} className="flex items-start gap-4">
                    <span className="text-3xl font-black text-white/10 leading-none">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 border-b border-white/5 pb-3">
                      <Link
                        href={article._type === 'rankings' ? `/articles/${article.slug.current}` : `/headlines/${article.slug.current}`}
                        className="text-base font-semibold text-white hover:text-emerald-300 transition-colors"
                      >
                        {article.homepageTitle || article.title}
                      </Link>
                      <div className="mt-1 text-xs uppercase tracking-wide text-white/40">
                        {article.category?.title || (article._type === 'rankings' ? `${article.rankingType?.replace('-', ' ')} rankings` : 'Headline')}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>
        {/* Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
          {/* Media embeds */}
          {headline.youtubeVideoId && (
            <div className="mb-4">
              <YouTubeEmbed
                videoId={headline.youtubeVideoId}
                title={headline.videoTitle || `Video: ${headline.title}`}
                variant="article"
              />
            </div>
          )}
          {!headline.youtubeVideoId && headline.twitterUrl && (
            <div className="mb-4 w-full">
              <TwitterEmbed twitterUrl={headline.twitterUrl} />
            </div>
          )}
          {!headline.youtubeVideoId && !headline.twitterUrl && headline.instagramUrl && (
            <div className="mb-4 w-full">
              <InstagramEmbed url={headline.instagramUrl} title={headline.instagramTitle} />
            </div>
          )}
          {!headline.youtubeVideoId && !headline.twitterUrl && !headline.instagramUrl && headline.tiktokUrl && (
            <div className="mb-4 w-full">
              <TikTokEmbed url={headline.tiktokUrl} title={headline.tiktokTitle} />
            </div>
          )}
          {/* Use homepageTitle if present for shorter sidebar list titles */}
          <RelatedArticles currentSlug={trimmedSlug} articles={otherHeadlines.map(h => ({...h, title: h.homepageTitle || h.title }))} />
          <div className="mt-6">
            {/* Async server component renders most recent headlines for broader recirculation */}
            <MostRead limit={6} />
          </div>
        </aside>
      </div>
      {/* Add social share section for consistency with fantasy articles */}
      <div className="px-6 md:px-12 pb-12 max-w-7xl mx-auto">
        <SocialShare url={shareUrl} title={headline.title} description={headline.summary || ''} variant="compact" />
      </div>
      <ArticleViewTracker slug={trimmedSlug} headlineId={headline._id} title={headline.title} category={headline.category?.title} author={headline.author?.name} readingTime={readingTime} className="hidden" />
    </main>
  );
}

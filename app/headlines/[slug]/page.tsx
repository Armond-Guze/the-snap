import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
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

  return generateSEOMetadata(headline, '/headlines');
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
      `*[_type == "headline" && published == true] | order(_createdAt desc)[0...24]{
        _id,
        _type,
        title,
        homepageTitle,
        slug,
        date,
        summary,
        author-> { name },
        coverImage { asset->{ url } }
      }`
    ),
  ]);

  if (!headline) notFound();

  // Calculate reading time
  const textContent = extractTextFromBlocks(headline.body || []);
  const readingTime = calculateReadingTime(textContent);

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Headlines', href: '/headlines' },
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
            </div>
          )}
          <section className="w-full mb-8">
            <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              {Array.isArray(headline.body) && <PortableText value={headline.body} components={portableTextComponents} />}
            </div>
          </section>
        </article>
        {/* Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
          {/* Use homepageTitle if present for shorter sidebar list titles */}
          <RelatedArticles currentSlug={trimmedSlug} articles={otherHeadlines.map(h => ({...h, title: h.homepageTitle || h.title }))} />
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

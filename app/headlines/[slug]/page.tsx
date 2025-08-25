import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import type { Headline, HeadlineListItem, HeadlinePageProps } from "@/types";
import RelatedArticles from "@/app/components/RelatedArticles";
// (Embeds will be reintroduced with lazy loading in a later phase)
import ReadingTime from "@/app/components/ReadingTime";
import Breadcrumb from "@/app/components/Breadcrumb";
import ArticleViewTracker from "@/app/components/ArticleViewTracker";
import { generateSEOMetadata } from "@/lib/seo";
import { headlineDetailQuery } from "@/sanity/lib/queries";
import { calculateReadingTime, extractTextFromBlocks } from "@/lib/reading-time";
import { formatArticleDate } from "@/lib/date-utils";
import { portableTextComponents } from "@/lib/portabletext-components";
import { Metadata } from 'next';
import StructuredData, { createEnhancedArticleStructuredData } from "@/app/components/StructuredData";
import ArticleViewWrapper from "@/app/components/ArticleViewWrapper";
import ProgressiveImage from "@/app/components/ProgressiveImage";

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
        title,
        slug,
        date,
        summary,
        author-> {
          name
        },
        coverImage {
          asset->{ url }
        }
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

  // Extract headings for TOC (mirror slugify logic: keep in sync with portabletext-components)
  const slugify = (text: string) => text.toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  interface SpanChild { _type: string; text: string; }
  interface Block { _type: string; style?: string; children?: SpanChild[]; }
  const tocHeadings = (headline.body as Block[] | undefined || [])
    .filter(b => b._type === 'block' && b.style && ['h2','h3','h4'].includes(b.style))
    .map(b => {
      const text = (b.children || []).map(c => c.text).join(' ');
      return { id: slugify(text), text, level: Number(b.style!.replace('h','')) };
    });

  const shareUrl = `https://thegamesnap.com/headlines/${trimmedSlug}`;

  // Structured Data
  const articleSD = createEnhancedArticleStructuredData({
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
    keywords: headline.tags?.map((t: { title: string }) => t.title),
    speakableSelectors: ['h1','meta[name="description"]'],
  });

  return (
    <main className="bg-black text-white min-h-screen pb-20">
      <StructuredData data={articleSD} />
      <ArticleViewWrapper headings={tocHeadings} shareUrl={shareUrl} title={headline.title} category={headline.category?.title}>
        <article className="flex flex-col">
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} className="mb-6" />
          </div>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wide text-emerald-400 font-medium">
              {headline.category?.title && <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-400/30 rounded">{headline.category.title}</span>}
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-400/30 rounded">Analysis</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6 max-w-[18ch]">
              {headline.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {headline.author?.name && (
                <span className="font-medium text-white/90">By {headline.author.name}{headline.author && 'role' in headline.author && (headline.author as { role?: string }).role ? `, ${(headline.author as { role?: string }).role}` : ''}</span>
              )}
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <time dateTime={headline.date}>{formatArticleDate(headline.date)}</time>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <ReadingTime minutes={readingTime} />
              {(headline as unknown as { _updatedAt?: string })._updatedAt && (headline as unknown as { _updatedAt?: string })._updatedAt !== headline.date && (
                <span className="text-xs text-gray-500">Updated {formatArticleDate((headline as unknown as { _updatedAt?: string })._updatedAt! )}</span>
              )}
            </div>
          </header>
          {headline.coverImage?.asset?.url && (
            <div className="mb-10 -mx-6 md:mx-0">
              <ProgressiveImage
                src={headline.coverImage.asset.url}
                alt={headline.title}
                fill
                aspect="16/9"
                priority
              />
              {headline.summary && (
                <p className="mt-4 text-lg text-gray-300 leading-relaxed max-w-[70ch]">{headline.summary}</p>
              )}
            </div>
          )}
          <div className="prose prose-invert max-w-[72ch] text-white">
            {headline.body && <PortableText value={headline.body} components={portableTextComponents} />}
          </div>
          <div className="mt-12 border-t border-white/10 pt-6">
            <RelatedArticles currentSlug={trimmedSlug} articles={otherHeadlines} />
          </div>
        </article>
      </ArticleViewWrapper>
      <ArticleViewTracker 
        slug={trimmedSlug}
        headlineId={headline._id}
        title={headline.title}
        category={headline.category?.title}
        author={headline.author?.name}
        readingTime={readingTime}
        className="hidden"
      />
    </main>
  );
}

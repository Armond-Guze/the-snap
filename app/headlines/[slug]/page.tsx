import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Headline, HeadlineListItem, HeadlinePageProps } from "@/types";
import RelatedArticles from "@/app/components/RelatedArticles";
import YouTubeEmbed from "@/app/components/YoutubeEmbed";
import TwitterEmbed from "@/app/components/TwitterEmbed";
import ReadingTime from "@/app/components/ReadingTime";
import SocialShare from "@/app/components/SocialShare";
import Breadcrumb from "@/app/components/Breadcrumb";
import ArticleViewTracker from "@/app/components/ArticleViewTracker";
import { generateSEOMetadata } from "@/lib/seo";
import { headlineDetailQuery } from "@/sanity/lib/queries";
import { calculateReadingTime, extractTextFromBlocks } from "@/lib/reading-time";
import { formatArticleDate } from "@/lib/date-utils";
import { portableTextComponents } from "@/lib/portabletext-components";
import { Metadata } from 'next';

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
      `*[_type == "headline" && published == true] | order(_createdAt desc)[0...6]{
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

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Article Section */}
        <article className="lg:col-span-2 flex flex-col">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-4" />
          
          {/* Title + Meta */}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">
            {headline.title}
          </h1>
          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
            {headline.author?.image?.asset?.url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={headline.author.image.asset.url}
                  alt={headline.author.name || "Author"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span>
              By {headline.author?.name || "Unknown"} •{" "}
              {formatArticleDate(headline.date)}
            </span>
            <span className="text-gray-500">•</span>
            <ReadingTime minutes={readingTime} />
          </div>
          {/* Cover Image */}
          {headline.coverImage?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md border border-slate-700 shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
  <Image
    src={headline.coverImage.asset.url}
    alt={headline.title}
    fill
    className="object-cover w-full h-full"
    priority
  />
</div>
            </div>
          )}
          {/* Body Text */}
          <section className="w-full mb-8">
            <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              {headline.body && <PortableText value={headline.body} components={portableTextComponents} />}
            </div>
          </section>

          {/* Social Share */}
          <SocialShare 
            url={`https://thegamesnap.com/headlines/${trimmedSlug}`}
            title={headline.title}
            description={headline.summary || ''}
            variant="compact"
            className="mb-8"
          />
        </article>
        
        {/* Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
          {/* Video/Social Section - YouTube or Twitter */}
          {headline.youtubeVideoId && (
            <div className="mb-4">
              <YouTubeEmbed 
                videoId={headline.youtubeVideoId}
                title={headline.videoTitle || `Video: ${headline.title}`}
                variant="article"
              />
            </div>
          )}
          
          {/* Twitter Embed - Only show if Twitter URL exists and no YouTube video */}
          {!headline.youtubeVideoId && headline.twitterUrl && (
            <div className="mb-4 w-full">
              <TwitterEmbed 
                twitterUrl={headline.twitterUrl}
                className="w-full"
              />
            </div>
          )}
          
          {/* Related Articles */}
          <RelatedArticles currentSlug={trimmedSlug} articles={otherHeadlines} />
        </aside>
      </div>
      
      {/* Article View Tracker */}
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

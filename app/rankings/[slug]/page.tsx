import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AVATAR_SIZES, ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import { sanityFetch } from "@/sanity/lib/fetch";
import { unifiedContentFields, rankingFields } from "@/sanity/lib/fragments";
import { normalizeContent } from "@/lib/content/normalize";
import type { UnifiedContent, LegacyRanking, NormalizedContent } from "@/types/content";
import type { Rankings as RankingsType, MovementIndicator, RankingTeam, HeadlineListItem } from "@/types";
import { portableTextComponents } from "@/lib/portabletext-components";
import { urlFor } from "@/sanity/lib/image";
import { Metadata } from 'next';
import RelatedArticles from "@/app/components/RelatedArticles";
import StructuredData, { createEnhancedArticleStructuredData } from "@/app/components/StructuredData";
import YouTubeEmbed from "@/app/components/YoutubeEmbed";
import TwitterEmbed from "@/app/components/TwitterEmbed";
import InstagramEmbed from "@/app/components/InstagramEmbed";
import TikTokEmbed from "@/app/components/TikTokEmbed";
import ReadingTime from "@/app/components/ReadingTime";
import SocialShare from "@/app/components/SocialShare";
import Breadcrumb from "@/app/components/Breadcrumb";
import ArticleViewTracker from "@/app/components/ArticleViewTracker";
import UnifiedRankingCard from "@/app/components/UnifiedRankingCard";
import { generateSEOMetadata } from "@/lib/seo";
import { gradientClassForTeam } from "@/lib/team-utils";
import { calculateReadingTime, extractTextFromBlocks } from "@/lib/formatting";
import { formatArticleDate } from "@/lib/formatting";

// Type guard to detect legacy article documents (former "rankings" type)
function isLegacyArticle(doc: unknown): doc is RankingsType {
  if (!doc || typeof doc !== 'object') return false;
  const rec = doc as Record<string, unknown>;
  return rec._type === 'article' || rec._type === 'rankings';
}

interface RankingsPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

// Updated query: ensure slug filter applies to unified ranking content too
const rankingsDetailQuery = `
  *[_type == "unifiedContent" && contentType == "ranking" && slug.current == $slug][0]{
    ${unifiedContentFields}
  }
`;

// Legacy rankings query for backward compatibility
const legacyRankingsDetailQuery = `
  *[_type in ["article","rankings"] && slug.current == $slug && published == true][0]{
    ${rankingFields}
  }
`;

export async function generateMetadata({ params }: RankingsPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Try unified content first, then legacy
  let ranking: UnifiedContent | LegacyRanking | null = null;
  try {
    ranking = await sanityFetch<UnifiedContent | LegacyRanking | null>(
      rankingsDetailQuery,
      { slug },
      { next: { revalidate: 300 } },
      null
    );
  } catch (err) {
    console.error('Article metadata fetch failed', err);
  }

  if (!ranking) {
    // Try legacy rankings
  const legacyRanking = await sanityFetch<RankingsType | null>(
      legacyRankingsDetailQuery,
      { slug },
      { next: { revalidate: 300 } },
      null
    );
    
    if (!legacyRanking) {
      return {
        title: 'Article Not Found | The Snap',
        description: 'The requested article could not be found.',
      };
    }
    
    return generateSEOMetadata(legacyRanking, '/articles');
  }

  const normalizedRanking = normalizeContent(ranking);
  
  // Transform normalized content to match ContentData interface
  const contentData = {
    title: normalizedRanking.title,
    summary: normalizedRanking.excerpt,
    slug: { 
      current: typeof normalizedRanking.slug === 'string' 
        ? normalizedRanking.slug 
        : normalizedRanking.slug?.current || '' 
    },
    seo: normalizedRanking.seo,
    coverImage: normalizedRanking.featuredImage,
    author: normalizedRanking.author
  };
  
  return generateSEOMetadata(contentData, '/articles');
}

export default async function RankingDetailPage({ params }: RankingsPageProps) {
  const { slug } = await params;
  
  // Fetch article content and related content in parallel
  const [ranking, legacyRanking, otherContent] = await Promise.all([
    (async () => {
      try {
        return await sanityFetch<UnifiedContent | LegacyRanking | null>(
          rankingsDetailQuery,
          { slug },
          { next: { revalidate: 300 } },
          null
        );
      } catch (e) {
        console.error('Unified ranking fetch error', e);
        return null;
      }
    })(),
  sanityFetch<RankingsType | null>(
      legacyRankingsDetailQuery,
      { slug },
      { next: { revalidate: 300 } },
      null
    ),
    sanityFetch(
      `*[(_type in ["unifiedContent", "headline", "powerRanking", "article", "rankings"]) && published == true] | order(_createdAt desc)[0...8]{
        _id,
        _type,
        title,
  homepageTitle,
        slug,
        excerpt,
        date,
        publishedAt,
        contentType,
        week,
        author-> {
          name
        },
        // support various image field names
        featuredImage { asset->{ url } },
        coverImage { asset->{ url } },
        image { asset->{ url } }
      }`,
      {},
      { next: { revalidate: 300 } },
      []
    )
  ]);

  // Select the most appropriate source
  const finalRanking = ranking || legacyRanking;

  if (!finalRanking) {
    notFound();
  }

  if (isLegacyArticle(finalRanking)) {
    return <LegacyRankingsRenderer ranking={finalRanking} slug={slug} otherContent={otherContent} />;
  }

  let normalizedRanking: NormalizedContent | null = null;
  try {
    normalizedRanking = normalizeContent(finalRanking as UnifiedContent | LegacyRanking);
  } catch (err) {
    console.error('normalizeContent failed for ranking slug', slug, err);
    return (
      <div className="px-4 py-24 text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Article Load Error</h1>
        <p className="text-white/60 mb-6">We hit an issue rendering this article page. It has been logged.</p>
      </div>
    );
  }
  if (!normalizedRanking) {
    notFound();
  }

  return <UnifiedRankingRenderer ranking={normalizedRanking} slug={slug} otherContent={otherContent} />;
}

// Legacy rankings renderer (preserves original layout)
interface SidebarContentItem {
  _id: string;
  _type: 'headline' | 'rankings' | string;
  title: string;
  slug: { current: string };
  date?: string;
  publishedAt?: string;
  rankingType?: string;
  author?: { name?: string };
  featuredImage?: { asset?: { url?: string } };
}

import type { PortableTextContent } from '@/types/content';
interface RankingsWithOptionalBody extends RankingsType { body?: PortableTextContent[] }

function LegacyRankingsRenderer({ ranking, slug, otherContent }: { ranking: RankingsWithOptionalBody; slug: string; otherContent: SidebarContentItem[]; }) {
  // Show article-style layout if body content exists
  const textBlocks = Array.isArray(ranking.body) ? ranking.body : [];
  const textContent = textBlocks.length ? extractTextFromBlocks(textBlocks) : '';
  const readingTime = calculateReadingTime(textContent);

  const breadcrumbItems = [
    { label: 'Articles', href: '/articles' },
    { label: ranking.title }
  ];

  // Build JSON-LD: NewsArticle + ItemList of teams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';
  const canonicalUrl = `${baseUrl}/articles/${slug}`;
  const ogImage = ranking.coverImage?.asset?.url || `${baseUrl}/images/thesnap-logo-new copy.jpg`;
  const articleLd = createEnhancedArticleStructuredData({
    headline: ranking.title,
    description: (ranking as { summary?: string; excerpt?: string }).summary || (ranking as { summary?: string; excerpt?: string }).excerpt || ranking.title,
    canonicalUrl,
    images: [{ url: ogImage }],
    datePublished: ranking.publishedAt || new Date().toISOString(),
    dateModified: ranking.publishedAt || new Date().toISOString(),
    author: { name: ranking.author?.name || 'The Snap' },
    articleSection: typeof ranking.category === 'string'
      ? ranking.category
      : (ranking as { category?: { title?: string } }).category?.title || 'Articles',
  });

  const listLd = Array.isArray(ranking.teams) && ranking.teams.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: ranking.title,
        itemListOrder: 'http://schema.org/ItemListOrderAscending',
        itemListElement: ranking.teams
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .map((t, i) => ({
            '@type': 'ListItem',
            position: t.rank ?? i + 1,
            name: t.teamName,
          })),
      }
    : null;

  return (
    <main className="bg-black text-white min-h-screen">
      {/* Structured Data */}
      <StructuredData data={articleLd} />
      {listLd && <StructuredData data={listLd as unknown as Record<string, unknown>} id="sd-itemlist" />}
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        <article className="lg:col-span-2 flex flex-col">
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">{ranking.title}</h1>
          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
            {ranking.author?.image?.asset?.url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image src={ranking.author.image.asset.url} alt={ranking.author?.name || 'Author'} fill sizes={AVATAR_SIZES} className="object-cover" />
              </div>
            )}
            <span>By {ranking.author?.name || 'Unknown'} • {ranking.publishedAt ? formatArticleDate(ranking.publishedAt) : ''}</span>
            <span className="text-gray-500">•</span>
            <ReadingTime minutes={readingTime} />
          </div>
          {ranking.coverImage?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image src={ranking.coverImage.asset.url} alt={ranking.title} fill sizes={ARTICLE_COVER_SIZES} className="object-cover w-full h-full" priority />
              </div>
            </div>
          )}
      {textBlocks.length > 0 && (
            <section className="w-full mb-8">
              <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
        <PortableText value={textBlocks} components={portableTextComponents} />
              </div>
            </section>
          )}
          {ranking.articleImage?.asset?.url && (
            <div className="w-full mb-8">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-none md:rounded-lg shadow-lg md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image src={ranking.articleImage.asset.url} alt={`${ranking.title} - Article Image`} fill className="object-cover w-full h-full" />
              </div>
            </div>
          )}
          {Array.isArray(ranking.teams) && ranking.teams.length > 0 && (
            <section className="w-full mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Key Highlights</h2>
              <div className="space-y-4">
                {ranking.teams.map((team: RankingTeam) => (
                  <RankingTeamCard key={`${team.rank}-${team.teamName}`} team={team} />
                ))}
              </div>
            </section>
          )}
          {ranking.methodology && (
            <section className="w-full mb-8">
              <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
                <h2 className="text-2xl font-bold text-white mb-4">Notes</h2>
                <PortableText value={ranking.methodology} components={portableTextComponents} />
              </div>
            </section>
          )}
          <SocialShare url={`${baseUrl}/articles/${slug}`} title={ranking.title} description={ranking.summary || ''} variant="compact" className="mb-8" />
        </article>
        <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
          {ranking.youtubeVideoId && (
            <div className="mb-4"><YouTubeEmbed videoId={ranking.youtubeVideoId} title={ranking.videoTitle || `Video: ${ranking.title}`} variant="article" /></div>
          )}
          {!ranking.youtubeVideoId && ranking.twitterUrl && (
            <div className="mb-4 w-full"><TwitterEmbed twitterUrl={ranking.twitterUrl} className="w-full" /></div>
          )}
          {!ranking.youtubeVideoId && !ranking.twitterUrl && ranking.instagramUrl && (
            <div className="mb-4 w-full"><InstagramEmbed url={ranking.instagramUrl} className="w-full" /></div>
          )}
            {!ranking.youtubeVideoId && !ranking.twitterUrl && !ranking.instagramUrl && ranking.tiktokUrl && (
            <div className="mb-4 w-full"><TikTokEmbed url={ranking.tiktokUrl} className="w-full" /></div>
          )}
          <RelatedArticles currentSlug={slug} articles={otherContent as unknown as HeadlineListItem[]} />
        </aside>
      </div>
      <ArticleViewTracker
        slug={slug}
        headlineId={ranking._id}
        title={ranking.title}
        category={typeof ranking.category === 'string' ? ranking.category : (ranking as { category?: { title?: string } }).category?.title || 'Article'}
        author={ranking.author?.name}
        readingTime={readingTime}
        className="hidden"
      />
    </main>
  );
}

// Unified ranking renderer (handles normalized content)
function UnifiedRankingRenderer({ 
  ranking, 
  slug, 
  otherContent 
}: { 
  ranking: NormalizedContent; 
  slug: string; 
  otherContent: SidebarContentItem[]; 
}) {
  // Calculate reading time if content is available
  const textContent = ranking.content ? 
    extractTextFromBlocks(ranking.content) : '';
  const readingTime = calculateReadingTime(textContent);

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Articles', href: '/articles' },
    { label: ranking.title }
  ];

  // Structured data for unified article
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';
  const canonicalUrl = `${baseUrl}/articles/${slug}`;
  const ogImage = ranking.featuredImage?.asset?.url || `${baseUrl}/images/thesnap-logo-new copy.jpg`;
  const articleLd = createEnhancedArticleStructuredData({
    headline: ranking.title,
    description: (ranking as { summary?: string; excerpt?: string }).summary
      || (ranking as { summary?: string; excerpt?: string }).excerpt
      || ranking.title,
    canonicalUrl,
    images: [{ url: ogImage }],
    datePublished: ranking.publishedAt || new Date().toISOString(),
    dateModified: ranking.publishedAt || new Date().toISOString(),
    author: { name: ranking.author?.name || 'The Snap' },
    articleSection: typeof ranking.category === 'string'
      ? ranking.category
      : (ranking as { category?: { title?: string } }).category?.title || 'Articles',
    keywords: ranking.teams?.slice(0,5).map(t => t.teamName || '').filter(Boolean),
  });
  const listLd = Array.isArray(ranking.teams) && ranking.teams.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: ranking.title,
        itemListOrder: 'http://schema.org/ItemListOrderAscending',
        itemListElement: ranking.teams
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .map((t, i) => ({
            '@type': 'ListItem',
            position: t.rank ?? i + 1,
            name: t.teamName || `Team #${t.rank}`,
          })),
      }
    : null;

  return (
    <main className="bg-black text-white min-h-screen">
      {/* Structured Data */}
      <StructuredData data={articleLd} />
      {listLd && <StructuredData data={listLd as unknown as Record<string, unknown>} id="sd-itemlist" />}
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Article Section */}
        <article className="lg:col-span-2 flex flex-col">
          {/* Breadcrumb */}
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
          </div>
          
          {/* Title + Meta */}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">
            {ranking.title}
          </h1>
          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
            {ranking.author?.image?.asset?.url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={ranking.author.image.asset.url}
                  alt={ranking.author?.name || "Author"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span>
              By {ranking.author?.name || "Unknown"} •{" "}
              {formatArticleDate(ranking.publishedAt)}
            </span>
            <span className="text-gray-500">•</span>
            <ReadingTime minutes={readingTime} />
          </div>

          {/* Cover Image */}
          {ranking.featuredImage?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image
                  src={ranking.featuredImage.asset.url}
                  alt={ranking.title}
                  fill
                  sizes={ARTICLE_COVER_SIZES}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          {ranking.content && ranking.content.length > 0 && (
            <section className="w-full mb-8">
              <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
                <PortableText value={ranking.content} components={portableTextComponents} />
              </div>
            </section>
          )}

          {/* Article Image */}
          {ranking.articleImage?.asset?.url && (
            <div className="w-full mb-8">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-none md:rounded-lg shadow-lg md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image
                  src={ranking.articleImage.asset.url}
                  alt={`${ranking.title} - Article Image`}
                  fill
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Optional highlights */}
          {ranking.teams && ranking.teams.length > 0 && (
            <section className="w-full mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Highlights</h2>
              <div className="space-y-4">
                {ranking.teams.map((team, index) => (
                  <UnifiedRankingCard key={`${team.rank}-${team.teamName || 'unknown'}-${index}`} teamData={team} />
                ))}
              </div>
            </section>
          )}

          {/* Social Share */}
          <SocialShare 
            url={`${baseUrl}/articles/${slug}`}
            title={ranking.title}
            description={ranking.excerpt || ''}
            variant="compact"
            className="mb-8"
          />
        </article>
        
        {/* Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
          {/* Related Articles */}
          <RelatedArticles currentSlug={slug} articles={otherContent as unknown as HeadlineListItem[]} />
        </aside>
      </div>
      
      {/* Article View Tracker */}
      <ArticleViewTracker 
        slug={slug}
        headlineId={ranking._id}
        title={ranking.title}
        category={typeof ranking.category === 'string' ? ranking.category : (ranking as { category?: { title?: string } }).category?.title || 'Article'}
        author={ranking.author?.name}
        readingTime={readingTime}
        className="hidden"
      />
    </main>
  );
}

// Traditional power rankings style component

// Helper function for movement indicators
function getMovementIndicator(change: number): MovementIndicator {
  if (change > 0) {
    return { symbol: `▲`, color: 'text-green-400' };
  } else if (change < 0) {
    return { symbol: `▼`, color: 'text-red-400' };
  }
  return { symbol: '—', color: 'text-gray-400' };
}

// Team card component for article-style rankings
function RankingTeamCard({ team }: { team: RankingTeam }) {
  const change = team.previousRank ? team.previousRank - team.rank : 0;
  const movement = getMovementIndicator(change);

  return (
    <article className="group">
      {/* Compact Team Header */}
          <div className="relative bg-black p-3">
        {/* Team Color Accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${gradientClassForTeam(team.teamName)}`} />
        
        <div className="flex items-center gap-4">
          {/* Rank Display */}
          <div className="flex flex-col items-center min-w-[60px] bg-black rounded-lg p-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Rank
            </span>
            <span className="text-2xl font-black text-white">
              {team.rank}
            </span>
          </div>

          {/* Team Logo */}
          {team.teamLogo?.asset && (
            <div className="flex-shrink-0">
              <Image
                src={urlFor(team.teamLogo).width(60).height(60).url()}
                alt={`${team.teamName} logo`}
                width={60}
                height={60}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
                priority={team.rank <= 5}
              />
            </div>
          )}

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {team.teamName}
              </h2>

              {/* Movement Indicator */}
              <div className="flex flex-col items-center min-w-[50px] rounded-lg p-2">
                <span className={`text-lg font-bold ${movement.color}`}>
                  {movement.symbol}
                </span>
                {change !== 0 ? (
                  <span className={`text-xs font-semibold ${movement.color}`}>
                    {Math.abs(change)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-3 bg-black p-6">
        {team.summary && (
          <p className="text-2xl text-gray-200 leading-relaxed mb-8">
            {team.summary}
          </p>
        )}
        {Array.isArray(team.analysis) && team.analysis.length > 0 && (
          <div className="text-2xl text-gray-200 leading-relaxed">
            <PortableText value={team.analysis} components={portableTextComponents} />
          </div>
        )}
      </div>
    </article>
  );
}

// Map full team names (or common variations) to standard NFL abbreviations used in gradient class names
// team code resolution handled by team-utils

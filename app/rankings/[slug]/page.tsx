import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Rankings, MovementIndicator, RankingTeam } from "@/types";
import { portableTextComponents } from "@/lib/portabletext-components";
import { urlFor } from "@/sanity/lib/image";
import { Metadata } from 'next';
import RelatedArticles from "@/app/components/RelatedArticles";
import YouTubeEmbed from "@/app/components/YoutubeEmbed";
import TwitterEmbed from "@/app/components/TwitterEmbed";
import ReadingTime from "@/app/components/ReadingTime";
import SocialShare from "@/app/components/SocialShare";
import Breadcrumb from "@/app/components/Breadcrumb";
import ArticleViewTracker from "@/app/components/ArticleViewTracker";
import { generateSEOMetadata } from "@/lib/seo";
import { calculateReadingTime, extractTextFromBlocks } from "@/lib/reading-time";
import { formatArticleDate } from "@/lib/date-utils";

interface RankingsPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

const rankingsDetailQuery = `
  *[_type == "rankings" && slug.current == $slug && published == true][0]{
    _id,
    title,
    slug,
    rankingType,
    summary,
    coverImage {
      asset->{ url }
    },
    author-> {
      name,
      image {
        asset->{ url }
      }
    },
    publishedAt,
    showAsArticle,
    articleContent,
    viewCount,
    youtubeVideoId,
    videoTitle,
    twitterUrl,
    teams[] {
      rank,
      previousRank,
      teamName,
      teamLogo {
        asset
      },
      teamColor,
      summary,
      analysis,
      stats[] {
        label,
        value
      }
    },
    methodology,
    seo
  }
`;

export async function generateMetadata({ params }: RankingsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ranking: Rankings = await client.fetch(rankingsDetailQuery, { slug });

  if (!ranking) {
    return {
      title: 'Rankings Not Found | The Snap',
      description: 'The requested rankings could not be found.',
    };
  }

  return generateSEOMetadata(ranking, '/rankings');
}

export default async function RankingDetailPage({ params }: RankingsPageProps) {
  const { slug } = await params;
  const [ranking, otherContent] = await Promise.all([
    client.fetch(rankingsDetailQuery, { slug }),
    client.fetch(`
      *[(_type == "headline" || _type == "rankings") && published == true] | order(_createdAt desc)[0...6]{
        _id,
        _type,
        title,
        slug,
        summary,
        date,
        publishedAt,
        rankingType,
        author-> {
          name
        },
        coverImage {
          asset->{ url }
        }
      }
    `)
  ]);

  if (!ranking) {
    notFound();
  }

  // Handle empty state
  if (!ranking.teams || ranking.teams.length === 0) {
    return (
      <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            No Rankings Available
          </h1>
          <p className="text-gray-400 text-lg">
            Rankings will be published soon. Check back later!
          </p>
        </div>
      </div>
    );
  }

  // If showAsArticle is true, use article layout
  if (ranking.showAsArticle) {
    // Calculate reading time for article content
    const textContent = ranking.articleContent ? 
      extractTextFromBlocks(ranking.articleContent) : '';
    const readingTime = calculateReadingTime(textContent);

    // Build breadcrumb items
    const breadcrumbItems = [
      { label: 'Rankings', href: '/rankings' },
      { label: ranking.title }
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
              {ranking.title}
            </h1>
            <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
              {ranking.author?.image?.asset?.url && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={ranking.author.image.asset.url}
                    alt={ranking.author.name || "Author"}
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
            {ranking.coverImage?.asset?.url && (
              <div className="w-full mb-6">
                <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md border border-slate-700 shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                  <Image
                    src={ranking.coverImage.asset.url}
                    alt={ranking.title}
                    fill
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Article Content */}
            {ranking.articleContent && ranking.articleContent.length > 0 && (
              <section className="w-full mb-8">
                <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
                  <PortableText value={ranking.articleContent} components={portableTextComponents} />
                </div>
              </section>
            )}

            {/* Rankings Display */}
            <section className="w-full mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">The Rankings</h2>
              <div className="space-y-4">
                {ranking.teams.map((team: RankingTeam) => (
                  <RankingTeamCard key={`${team.rank}-${team.teamName}`} team={team} />
                ))}
              </div>
            </section>

            {/* Methodology */}
            {ranking.methodology && (
              <section className="w-full mb-8">
                <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
                  <h2 className="text-2xl font-bold text-white mb-4">Methodology</h2>
                  <PortableText value={ranking.methodology} components={portableTextComponents} />
                </div>
              </section>
            )}

            {/* Social Share */}
            <SocialShare 
              url={`https://thegamesnap.com/rankings/${slug}`}
              title={ranking.title}
              description={ranking.summary || ''}
              variant="compact"
              className="mb-8"
            />
          </article>
          
          {/* Sidebar */}
          <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
            {/* Video/Social Section - YouTube or Twitter */}
            {ranking.youtubeVideoId && (
              <div className="mb-4">
                <YouTubeEmbed 
                  videoId={ranking.youtubeVideoId}
                  title={ranking.videoTitle || `Video: ${ranking.title}`}
                  variant="article"
                />
              </div>
            )}
            
            {/* Twitter Embed - Only show if Twitter URL exists and no YouTube video */}
            {!ranking.youtubeVideoId && ranking.twitterUrl && (
              <div className="mb-4 w-full">
                <TwitterEmbed 
                  twitterUrl={ranking.twitterUrl}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Related Articles */}
            <RelatedArticles currentSlug={slug} articles={otherContent} />
          </aside>
        </div>
        
        {/* Article View Tracker */}
        <ArticleViewTracker 
          slug={slug}
          headlineId={ranking._id}
          title={ranking.title}
          category={ranking.rankingType}
          author={ranking.author?.name}
          readingTime={readingTime}
          className="hidden"
        />
      </main>
    );
  }

  // Otherwise, use traditional power rankings layout
  return <PowerRankingsStyleRanking ranking={ranking} />;
}

// Traditional power rankings style component
function PowerRankingsStyleRanking({ ranking }: { ranking: Rankings }) {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen">
      <header className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white">
          {ranking.title}
        </h1>
        <div className="w-24 h-1 bg-white mx-auto mt-6 mb-6"></div>
        <p className="text-xl text-gray-300 font-medium">
          {ranking.summary || `Latest ${ranking.rankingType || 'rankings'} updated weekly`} • {ranking.teams.length} teams
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 bg-black rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          <span className="text-sm text-green-400 font-semibold">
            Live Rankings
          </span>
        </div>
      </header>

      <div className="space-y-12 max-w-3xl mx-auto">
        {ranking.teams.map((team: RankingTeam) => (
          <PowerRankingTeamCard key={`${team.rank}-${team.teamName}`} team={team} />
        ))}
      </div>

      {/* Methodology Section */}
      {ranking.methodology && (
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-black p-6">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Methodology
            </h2>
            <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
            <div className="text-xl text-gray-200 leading-relaxed">
              <PortableText value={ranking.methodology} components={portableTextComponents} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Team card component for power rankings style
function PowerRankingTeamCard({ team }: { team: RankingTeam }) {
  const change = team.previousRank ? team.previousRank - team.rank : 0;
  const movement = getMovementIndicator(change);

  return (
    <article className="group">
      {/* Compact Team Header */}
      <div className="relative bg-black p-3">
        {/* Team Color Accent */}
        {team.teamColor && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: team.teamColor }}
          />
        )}
        
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
        {team.teamColor && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: team.teamColor }}
          />
        )}
        
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

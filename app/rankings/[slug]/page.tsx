import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Rankings, MovementIndicator } from "@/types";
import { portableTextComponents } from "@/lib/portabletext-components";
import { urlFor } from "@/sanity/lib/image";
import { Metadata } from 'next';
import Breadcrumb from "@/app/components/Breadcrumb";
import ReadingTime from "@/app/components/ReadingTime";
import ArticleViewWrapper from "@/app/components/ArticleViewWrapper";
import { formatArticleDate } from "@/lib/date-utils";
import { calculateReadingTime, extractTextFromBlocks } from "@/lib/reading-time";

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

// Helper function to calculate team movement - EXACT SAME AS POWER RANKINGS
function getMovementIndicator(change: number): MovementIndicator {
  if (change > 0) {
    return { symbol: "▲", color: "text-green-400" };
  } else if (change < 0) {
    return { symbol: "▼", color: "text-red-500" };
  } else {
    return { symbol: "–", color: "text-gray-400" };
  }
}


export async function generateMetadata({ params }: RankingsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ranking: Rankings = await client.fetch(rankingsDetailQuery, { slug });

  if (!ranking) {
    return {
      title: 'Rankings Not Found | The Snap',
      description: 'The requested rankings could not be found.',
    };
  }

  return {
    title: ranking.title,
    description: ranking.summary || `${ranking.title} - Expert NFL rankings and analysis.`,
    openGraph: {
      title: ranking.title,
      description: ranking.summary || `${ranking.title} - Expert NFL rankings and analysis.`,
      images: ranking.coverImage?.asset?.url ? [ranking.coverImage.asset.url] : [],
    },
  };
}

export default async function RankingDetailPage({ params }: RankingsPageProps) {
  const { slug } = await params;
  const ranking: Rankings = await client.fetch(rankingsDetailQuery, { slug });

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

  // Check if this is a power ranking to use special layout
  const isPowerRanking = ranking.rankingType?.toLowerCase() === 'power rankings';

  if (isPowerRanking) {
    // Use the special power rankings layout
    return (
      <ArticleViewWrapper
        articleId={ranking._id}
        articleSlug={slug}
        articleType="rankings"
        articleTitle={ranking.title}
      >
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
          {ranking.teams.map((team) => {
            const {
              rank,
              previousRank,
              teamName,
              teamLogo,
              summary,
              analysis,
            } = team;
            const change = previousRank ? previousRank - rank : 0;
            const movement = getMovementIndicator(change);

            return (
              <article key={`${rank}-${teamName}`} className="group">
                {/* Compact Team Header */}
                <div className="relative bg-black p-3">
                  {/* Team Color Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />

                  <div className="flex items-center gap-4">
                    {/* Rank Display */}
                    <div className="flex flex-col items-center min-w-[60px] bg-black rounded-lg p-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                        Rank
                      </span>
                      <span className="text-2xl font-black text-white">
                        {rank}
                      </span>
                    </div>

                    {/* Team Logo */}
                    {teamLogo?.asset && (
                      <div className="flex-shrink-0">
                        <Image
                          src={urlFor(teamLogo).width(60).height(60).url()}
                          alt={`${teamName} logo`}
                          width={60}
                          height={60}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
                          priority={rank <= 5}
                        />
                      </div>
                    )}

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                          {teamName}
                        </h2>

                        {/* Movement Indicator */}
                        <div className="flex flex-col items-center min-w-[50px] bg-gray-900 rounded-lg p-2">
                          <span
                            className={`text-lg font-bold ${movement.color}`}
                          >
                            {movement.symbol}
                          </span>
                          {change !== 0 ? (
                            <span
                              className={`text-xs font-semibold ${movement.color}`}
                            >
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
                  {summary && (
                    <p className="text-2xl text-gray-200 leading-relaxed mb-8">
                      {summary}
                    </p>
                  )}
                  {Array.isArray(analysis) && analysis.length > 0 && (
                    <div className="text-2xl text-gray-200 leading-relaxed">
                      <PortableText value={analysis} components={portableTextComponents} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
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
      </ArticleViewWrapper>
    );
  }

  // Use article layout for non-power rankings
  // Calculate reading time from teams content
  const textContent = ranking.teams.map(team => {
    let content = team.summary || '';
    if (Array.isArray(team.analysis)) {
      content += ' ' + extractTextFromBlocks(team.analysis);
    }
    return content;
  }).join(' ');
  
  const readingTime = calculateReadingTime(textContent);

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Rankings', href: '/rankings' },
    { label: ranking.title }
  ];

  return (
    <main className="bg-black text-white min-h-screen">
      <ArticleViewWrapper
        articleId={ranking._id}
        articleSlug={slug}
        articleType="rankings"
        articleTitle={ranking.title}
      >
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
          <article className="max-w-4xl mx-auto">
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
                By {ranking.author?.name || "The Snap Team"} •{" "}
                {formatArticleDate(ranking.publishedAt)}
              </span>
              <span className="text-gray-500">•</span>
              <ReadingTime minutes={readingTime} />
            </div>

          {/* Summary */}
          {ranking.summary && (
            <div className="mb-8">
              <p className="text-xl text-gray-300 leading-relaxed">
                {ranking.summary}
              </p>
            </div>
          )}

          {/* Rankings Content - EXACT SAME STYLE AS POWER RANKINGS */}
          <div className="space-y-12 mb-8">
            {ranking.teams.map((team) => {
              const {
                rank,
                previousRank,
                teamName,
                teamLogo,
                summary,
                analysis,
                stats,
              } = team;
              const change = previousRank ? previousRank - rank : 0;
              const movement = getMovementIndicator(change);

              return (
                <article key={`${rank}-${teamName}`} className="group">
                  {/* Compact Team Header - EXACT SAME AS POWER RANKINGS */}
                  <div className="relative bg-black p-3">
                    {/* Team Color Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />

                    <div className="flex items-center gap-4">
                      {/* Rank Display */}
                      <div className="flex flex-col items-center min-w-[60px] bg-black rounded-lg p-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                          Rank
                        </span>
                        <span className="text-2xl font-black text-white">
                          {rank}
                        </span>
                      </div>

                      {/* Team Logo */}
                      {teamLogo?.asset && (
                        <div className="flex-shrink-0">
                          <Image
                            src={urlFor(teamLogo).width(60).height(60).url()}
                            alt={`${teamName} logo`}
                            width={60}
                            height={60}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
                            priority={rank <= 5}
                          />
                        </div>
                      )}

                      {/* Team Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                            {teamName}
                          </h2>

                          {/* Movement Indicator */}
                          <div className="flex flex-col items-center min-w-[50px] bg-gray-900 rounded-lg p-2">
                            <span
                              className={`text-lg font-bold ${movement.color}`}
                            >
                              {movement.symbol}
                            </span>
                            {change !== 0 ? (
                              <span
                                className={`text-xs font-semibold ${movement.color}`}
                              >
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

                  {/* Content Section - EXACT SAME AS POWER RANKINGS */}
                  <div className="mt-3 bg-black p-6">
                    {summary && (
                      <p className="text-2xl text-gray-200 leading-relaxed mb-8">
                        {summary}
                      </p>
                    )}
                    {Array.isArray(analysis) && analysis.length > 0 && (
                      <div className="text-2xl text-gray-200 leading-relaxed">
                        <PortableText value={analysis} components={portableTextComponents} />
                      </div>
                    )}

                    {/* Team Stats */}
                    {stats && stats.length > 0 && (
                      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                          <div key={index} className="text-center">
                            <div className="text-lg font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-gray-400 uppercase">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Methodology Section */}
          {ranking.methodology && (
            <div className="mt-12 border-t border-gray-700 pt-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Methodology
              </h2>
              <div className="prose prose-invert text-white max-w-none">
                <PortableText value={ranking.methodology} components={portableTextComponents} />
              </div>
            </div>
          )}
        </article>
      </div>
      </ArticleViewWrapper>
    </main>
  );
}

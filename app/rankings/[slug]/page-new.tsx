import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Rankings, MovementIndicator, RankingTeam } from "@/types";
import { portableTextComponents } from "@/lib/portabletext-components";
import { urlFor } from "@/sanity/lib/image";
import { Metadata } from 'next';

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

  // If showAsArticle is true, use article layout
  if (ranking.showAsArticle) {
    return (
      <div className="min-h-screen bg-stadium-night">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Article Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 py-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Article Header */}
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {ranking.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                    {ranking.rankingType.replace('-', ' ').toUpperCase()} RANKINGS
                  </span>
                  <span>{new Date(ranking.publishedAt).toLocaleDateString()}</span>
                  {ranking.author?.name && <span>by {ranking.author.name}</span>}
                </div>
              </header>

              {/* Article Content */}
              {ranking.articleContent && ranking.articleContent.length > 0 && (
                <div className="prose prose-invert prose-lg max-w-none mb-12">
                  <PortableText 
                    value={ranking.articleContent} 
                    components={portableTextComponents} 
                  />
                </div>
              )}

              {/* Rankings Display */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-white mb-8">The Rankings</h2>
                <div className="space-y-6">
                  {ranking.teams.map((team) => (
                    <RankingTeamCard key={`${team.rank}-${team.teamName}`} team={team} />
                  ))}
                </div>
              </div>

              {/* Methodology */}
              {ranking.methodology && (
                <div className="prose prose-invert prose-lg max-w-none mb-12">
                  <h2 className="text-2xl font-bold text-white mb-4">Methodology</h2>
                  <PortableText 
                    value={ranking.methodology} 
                    components={portableTextComponents} 
                  />
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-8 space-y-8">
                <div className="bg-black rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">More Rankings</h3>
                  <p className="text-gray-400 text-sm">Check out our other NFL rankings and analysis.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
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
        {ranking.teams.map((team) => (
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

// Team card component for article-style rankings
function RankingTeamCard({ team }: { team: RankingTeam }) {
  const change = team.previousRank ? team.previousRank - team.rank : 0;
  const movement = getMovementIndicator(change);

  return (
    <div className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center min-w-[48px] h-12 bg-purple-600 rounded-lg text-xl font-bold text-white">
          {team.rank}
        </div>
        {team.teamLogo?.asset && (
          <div className="relative w-12 h-12">
            <Image
              src={urlFor(team.teamLogo).width(48).height(48).url()}
              alt={team.teamName}
              fill
              className="object-contain rounded-full"
            />
          </div>
        )}
        <div className="flex-1">
          <h3
            className="text-xl font-bold text-white"
            style={team.teamColor ? { color: team.teamColor } : undefined}
          >
            {team.teamName}
          </h3>
          {team.previousRank && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Previous: #{team.previousRank}</span>
              <span className={`font-semibold ${movement.color}`}>
                {movement.symbol}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {team.summary && (
        <p className="text-gray-300 mb-4">{team.summary}</p>
      )}
      
      {team.analysis && (
        <div className="prose prose-invert prose-sm max-w-none">
          <PortableText value={team.analysis} components={portableTextComponents} />
        </div>
      )}
      
      {team.stats && team.stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {team.stats.map((stat, index: number) => (
            <div key={index} className="bg-black rounded p-3 text-center">
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
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
              <h2
                className="text-xl sm:text-2xl font-bold text-white truncate"
                style={team.teamColor ? { color: team.teamColor } : undefined}
              >
                {team.teamName}
              </h2>

              {/* Movement Indicator */}
              <div className="flex flex-col items-center min-w-[50px] bg-gray-900 rounded-lg p-2">
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
    return { symbol: `↑${change}`, color: 'text-green-400' };
  } else if (change < 0) {
    return { symbol: `↓${Math.abs(change)}`, color: 'text-red-400' };
  }
  return { symbol: '—', color: 'text-gray-400' };
}

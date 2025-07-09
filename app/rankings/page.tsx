import Link from "next/link";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Rankings } from "@/types";
import { formatArticleDate } from "@/lib/date-utils";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL Rankings | The Snap',
  description: 'Comprehensive NFL rankings covering offense, defense, fantasy football, and more. Expert analysis and data-driven insights.',
  openGraph: {
    title: 'NFL Rankings | The Snap',
    description: 'Comprehensive NFL rankings covering offense, defense, fantasy football, and more.',
    type: 'website',
  },
};

export const revalidate = 60;

const rankingsListQuery = `
  *[_type == "rankings" && published == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    rankingType,
    summary,
    coverImage {
      asset->{ url }
    },
    author-> {
      name
    },
    publishedAt,
    teams[0..2] {
      rank,
      teamName,
      teamLogo {
        asset->{ url }
      }
    }
  }
`;

const getRankingTypeDisplay = (type: string) => {
  const types: Record<string, string> = {
    'offense': 'Offensive Rankings',
    'defense': 'Defensive Rankings',
    'rookie': 'Rookie Rankings',
    'fantasy-qb': 'Fantasy QB Rankings',
    'fantasy-rb': 'Fantasy RB Rankings',
    'fantasy-wr': 'Fantasy WR Rankings',
    'fantasy-te': 'Fantasy TE Rankings',
    'draft': 'Draft Rankings',
    'position': 'Position Rankings',
    'team': 'Team Rankings',
  };
  return types[type] || type;
};

export default async function RankingsPage() {
  const rankings: Rankings[] = await client.fetch(rankingsListQuery);

  if (!rankings || rankings.length === 0) {
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

  // Group rankings by type
  const groupedRankings = rankings.reduce((acc, ranking) => {
    const type = ranking.rankingType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(ranking);
    return acc;
  }, {} as Record<string, Rankings[]>);

  return (
    <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen">
      <header className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white">
          NFL Rankings
        </h1>
        <div className="w-24 h-1 bg-white mx-auto mt-6 mb-6"></div>
        <p className="text-xl text-gray-300 font-medium">
          Comprehensive rankings covering all aspects of the NFL
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 bg-black rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          <span className="text-sm text-green-400 font-semibold">
            Live Rankings
          </span>
        </div>
      </header>

      {/* Rankings Grid */}
      <div className="space-y-12 max-w-5xl mx-auto">
        {Object.entries(groupedRankings).map(([type, typeRankings]) => (
          <div key={type} className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              {getRankingTypeDisplay(type)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typeRankings.map((ranking) => (
                <Link
                  key={ranking._id}
                  href={`/rankings/${ranking.slug.current}`}
                  className="group block"
                >
                  <article className="bg-black border border-gray-800 hover:border-gray-600 transition-all duration-300 rounded-lg overflow-hidden">
                    {/* Cover Image */}
                    {ranking.coverImage?.asset?.url && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={ranking.coverImage.asset.url}
                          alt={ranking.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-300 transition-colors">
                        {ranking.title}
                      </h3>
                      
                      {ranking.summary && (
                        <p className="text-gray-200 text-sm mb-4 leading-relaxed">
                          {ranking.summary}
                        </p>
                      )}

                      {/* Top 3 Preview */}
                      {ranking.teams && ranking.teams.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                            Top 3:
                          </p>
                          {ranking.teams.slice(0, 3).map((team) => (
                            <div key={team.rank} className="flex items-center gap-3">
                              <div className="flex items-center justify-center min-w-[20px] h-5 bg-gray-900 rounded text-xs font-bold text-white">
                                {team.rank}
                              </div>
                              {team.teamLogo?.asset?.url && (
                                <div className="relative w-5 h-5">
                                  <Image
                                    src={team.teamLogo.asset.url}
                                    alt={team.teamName}
                                    fill
                                    className="object-contain rounded-full"
                                  />
                                </div>
                              )}
                              <span className="text-sm text-gray-300 font-medium truncate">
                                {team.teamName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-800">
                        <span className="font-medium">{formatArticleDate(ranking.publishedAt)}</span>
                        {ranking.author?.name && (
                          <span>by {ranking.author.name}</span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

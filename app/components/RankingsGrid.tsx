import { client } from "@/sanity/lib/client";
import { headlineQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";
import { CARD_SIZES, THUMB_SIZES } from '@/lib/image-sizes';
import { FaAlignLeft, FaTrophy } from 'react-icons/fa';
import type { HeadlineListItem, Rankings } from "@/types";
import { formatArticleDate } from "@/lib/date-utils";

// Query specifically for rankings
const rankingsQuery = `
  *[_type == "rankings" && published == true] | order(publishedAt desc) {
    _id,
    _type,
    title,
  homepageTitle,
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

interface RankingsGridProps {
  showSidebar?: boolean;
  featuredRanking?: Rankings;
}

export default async function RankingsGrid({ showSidebar = true }: RankingsGridProps) {
  const [rankings, headlines] = await Promise.all([
    client.fetch(rankingsQuery) as Promise<Rankings[]>,
    showSidebar ? client.fetch(headlineQuery) as Promise<HeadlineListItem[]> : Promise.resolve([])
  ]);

  if (!rankings?.length) return null;

  const main = rankings[0];
  const otherRankings = rankings.slice(1);

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineListItem) => {
    if (item._type === 'rankings') {
      return `/articles/${item.slug.current.trim()}`;
    }
    return `/articles/${item.slug.current.trim()}`;
  };

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

  return (
    <section className="relative py-24 px-6 lg:px-8 bg-deep-black">
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white">
            NFL Articles & Analysis
          </h1>
          <div className="w-24 h-1 bg-white mx-auto mt-6 mb-6"></div>
          <p className="text-xl text-gray-300 font-medium">
            Long-form breakdowns, lists, and deep dives across the league
          </p>
        </div>

        <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-3' : ''} gap-8`}>
          {/* Main Rankings Content */}
          <div className={showSidebar ? 'lg:col-span-2' : ''}>
            {/* Featured Ranking */}
            {main?.coverImage && main?.slug?.current && (
              <div className="rounded-3xl backdrop-blur-sm overflow-hidden hover:bg-black transition-all duration-300 group mb-12">
                <Link href={`/articles/${main.slug.current.trim()}`}>
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={urlFor(main.coverImage).width(800).url()}
                      alt={main.title}
                      width={800}
                      height={450}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                        <FaTrophy className="w-3 h-3 mr-1" />
                        {getRankingTypeDisplay(main.rankingType)}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-6">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight text-white hover:text-gray-300 transition-colors duration-300">
                    {main.homepageTitle || main.title || "Untitled"}

                  </h2>
                  <p className="text-gray-300 text-base leading-snug mb-4">
                    {main.summary || "No summary available."}
                  </p>

                  {/* Top 3 Preview for Featured */}
                  {main.teams && main.teams.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                        Top 3:
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {main.teams.slice(0, 3).map((team) => (
                          <div key={team.rank} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-center min-w-[24px] h-6 bg-purple-600 rounded text-xs font-bold text-white">
                              {team.rank}
                            </div>
                            {team.teamLogo?.asset?.url && (
                              <div className="relative w-6 h-6">
                                <Image
                                  src={team.teamLogo.asset.url}
                                  alt={team.teamName}
                                  fill
                                  sizes={THUMB_SIZES}
                                  className="object-contain rounded-full"
                                />
                              </div>
                            )}
                            <span className="text-sm text-white font-medium">
                              {team.teamName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other Rankings Grid */}
            {otherRankings.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8">More Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherRankings.map((ranking) => (
                    <Link
                      key={ranking._id}
                      href={`/articles/${ranking.slug.current}`}
                      className="group block"
                    >
                      <article className="bg-black border border-gray-800 hover:border-gray-600 transition-all duration-300 rounded-lg overflow-hidden h-full">
                        {/* Cover Image */}
                        {ranking.coverImage?.asset?.url && (
                          <div className="relative h-40 overflow-hidden">
                            <Image
                              src={ranking.coverImage.asset.url}
                              alt={ranking.title}
                              fill
                              sizes={CARD_SIZES}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-600/90 text-white">
                                {getRankingTypeDisplay(ranking.rankingType)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4">
                      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gray-300 transition-colors">
                        {ranking.homepageTitle || ranking.title}

                      </h4>
                          
                          {ranking.summary && (
                            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                              {ranking.summary}
                            </p>
                          )}

                          {/* Top 3 Preview */}
                          {ranking.teams && ranking.teams.length > 0 && (
                            <div className="space-y-1 mb-3">
                              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                Top 3:
                              </p>
                              {ranking.teams.slice(0, 3).map((team) => (
                                <div key={team.rank} className="flex items-center gap-2">
                                  <div className="flex items-center justify-center min-w-[18px] h-4 bg-gray-700 rounded text-xs font-bold text-white">
                                    {team.rank}
                                  </div>
                                  {team.teamLogo?.asset?.url && (
                                    <div className="relative w-4 h-4">
                                      <Image
                                        src={team.teamLogo.asset.url}
                                        alt={team.teamName}
                                        fill
                                        sizes={THUMB_SIZES}
                                        className="object-contain rounded-full"
                                      />
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-300 font-medium truncate">
                                    {team.teamName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-800">
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
            )}
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-1 bg-black rounded-2xl p-8 self-start">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-white rounded-full mr-3"></div>
                <h3 className="text-xl font-bold text-white">Around The NFL</h3>
              </div>
              <ul className="space-y-3 text-sm">
                {headlines.slice(0, 8).map((headline) => (
                  <li
                    key={headline._id}
                    className="border-b border-gray-700/50 pb-3 last:border-b-0 last:pb-0"
                  >
                    {headline.slug?.current ? (
                      <Link href={getArticleUrl(headline)}>
                        <div className="flex items-start gap-3 group cursor-pointer">
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                            <FaAlignLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                          </div>
                          <div className="flex-1">
                            <span className="hover:text-gray-400 transition-colors duration-300 font-medium leading-tight text-white block">
                              {headline.homepageTitle || headline.title}

                            </span>
                            {headline._type === 'rankings' && headline.rankingType && (
                              <span className="text-xs text-purple-400 mt-1 block font-semibold">
                                {headline.rankingType.replace('-', ' ').toUpperCase()} RANKINGS
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                        {headline.title || "Untitled"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

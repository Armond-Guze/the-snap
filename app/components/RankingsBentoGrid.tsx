import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";

interface RankingItem {
  _id: string;
  _type: string;
  title: string;
  slug: { current: string };
  summary?: string;
  excerpt?: string;
  coverImage?: {
    asset?: {
      _ref: string;
      _type: string;
      url?: string;
    };
  };
  articleImage?: {
    asset?: {
      _ref: string;
      _type: string;
      url?: string;
    };
  };
  author?: { name: string };
  rankingType?: string;
  priority?: number;
  publishedAt?: string;
  week?: number;
  showAsArticle?: boolean;
}

interface RankingsBentoGridProps {
  textureSrc?: string;
}

export default async function RankingsBentoGrid({ textureSrc }: RankingsBentoGridProps) {
  // Query for rankings content ordered by priority (1 = biggest featured, 2, 3, etc.)
  const rankingsQuery = `
    *[_type == "rankings" && published == true] 
    | order(priority asc, publishedAt desc, _createdAt desc) [0...6] {
      _id,
      _type,
      title,
      slug,
      summary,
      excerpt,
      coverImage {
        asset-> {
          _ref,
          _type,
          url
        }
      },
      articleImage {
        asset-> {
          _ref,
          _type,
          url
        }
      },
      author-> {
        name
      },
      rankingType,
      priority,
      publishedAt,
      week,
      showAsArticle
    }
  `;

  const rankings: RankingItem[] = await sanityFetch(
    rankingsQuery,
    {},
    { next: { revalidate: 300 } },
    []
  );

  // If no rankings, don't render the section
  if (!rankings?.length) {
    return null;
  }

  const mainRanking = rankings[0]; // First ranking (main featured)
  const sideRankings = rankings.slice(1, 6) || []; // Next 5 rankings for side cards

  // Helper function to get the correct URL
  const getRankingUrl = (item: RankingItem) => {
    return `/rankings/${item.slug.current.trim()}`;
  };

  // Helper to get ranking badge text
  const getRankingBadge = (item: RankingItem) => {
    if (item.week) {
      return `Week ${item.week} Rankings`;
    }
    if (item.rankingType) {
      const typeMap: Record<string, string> = {
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
      return typeMap[item.rankingType] || 'Rankings';
    }
    return 'Rankings';
  };

  return (
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {textureSrc && (
        <>
          <div className="absolute inset-0 -z-20">
            <Image
              src={textureSrc}
              alt="NFL background"
              fill
              priority
              quality={100}
              className="object-cover opacity-30 md:opacity-35"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-black/90 -z-10" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        {/* Section Headers - Top Left */}
        <div className="mb-4 2xl:mb-6 3xl:mb-8">
          <div className="flex flex-wrap items-center gap-8 mb-3">
            <h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-300">
              Latest Rankings
            </h2>
          </div>
        </div>

        {/* Bento Grid Layout - Only Center and Right (like More Headlines) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 2xl:gap-6 3xl:gap-8">
          {/* Center - Large Featured Card */}
          <div className="lg:col-span-3">
            {mainRanking && mainRanking.slug?.current ? (
              <Link href={getRankingUrl(mainRanking)} className="group">
                <div className="relative h-full min-h-[500px] 2xl:min-h-[600px] 3xl:min-h-[700px] rounded-xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.01] shadow-xl hover:shadow-2xl">
                  {mainRanking.coverImage?.asset?.url ? (
                    <Image
                      src={mainRanking.coverImage.asset.url}
                      alt={mainRanking.title}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-102 transition-all duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div className="flex items-start justify-end">
                      <svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-2xl lg:text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                        {mainRanking.title}
                      </h3>
                      {(mainRanking.summary || mainRanking.excerpt) && (
                        <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl line-clamp-3 leading-relaxed">
                          {mainRanking.summary || mainRanking.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative h-full min-h-[500px] rounded-xl overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                <div className="relative h-full flex flex-col justify-between p-8">
                  <div className="flex items-start justify-end">
                    <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">No Rankings Available</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Check back soon for the latest NFL rankings and analysis.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Two Small Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4 2xl:gap-6 3xl:gap-8">
            {/* Top Right Card */}
            {sideRankings[0] && sideRankings[0].slug?.current ? (
              <Link href={getRankingUrl(sideRankings[0])} className="group">
                <div className="relative h-[240px] 2xl:h-[280px] 3xl:h-[320px] rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.01] shadow-xl hover:shadow-2xl">
                  {sideRankings[0].coverImage?.asset?.url ? (
                    <Image
                      src={sideRankings[0].coverImage.asset.url}
                      alt={sideRankings[0].title}
                      fill
                      className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex items-start justify-end">
                      <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {sideRankings[0].title}
                      </h3>
                      {(sideRankings[0].summary || sideRankings[0].excerpt) && (
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                          {sideRankings[0].summary || sideRankings[0].excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-lg bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No rankings available</p>
              </div>
            )}

            {/* Bottom Right Card */}
            {sideRankings[1] && sideRankings[1].slug?.current ? (
              <Link href={getRankingUrl(sideRankings[1])} className="group">
                <div className="relative h-[240px] 2xl:h-[280px] 3xl:h-[320px] rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.01] shadow-xl hover:shadow-2xl">
                  {sideRankings[1].coverImage?.asset?.url ? (
                    <Image
                      src={sideRankings[1].coverImage.asset.url}
                      alt={sideRankings[1].title}
                      fill
                      className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex items-start justify-end">
                      <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {sideRankings[1].title}
                      </h3>
                      {(sideRankings[1].summary || sideRankings[1].excerpt) && (
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                          {sideRankings[1].summary || sideRankings[1].excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-lg bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No rankings available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

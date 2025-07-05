import { client } from "@/sanity/lib/client";
import { headlineQuery, powerRankingsQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface Headline {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
  summary?: string;
  coverImage?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
}

export default async function BentoGrid() {
  // Fetch data from Sanity
  const [headlines, powerRankings] = await Promise.all([
    client.fetch(headlineQuery),
    client.fetch(powerRankingsQuery),
  ]);

  const featuredHeadline = headlines?.[0];
  const latestHeadlines = headlines?.slice(1, 4) || [];
  const topTeams = powerRankings?.slice(0, 3) || [];

  return (
    <section className="relative py-24 px-6 lg:px-8 bg-deep-black">
      <div className="relative mx-auto max-w-7xl">
        {/* Section Headers - Top Left */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-8 mb-4">
            <h2 className="text-xl sm:text-xl font-bold text-gray-300">
              Fantasy
            </h2>
            <h2 className="text-xl sm:text-xl font-bold text-gray-300">
              Standings
            </h2>
            <h2 className="text-xl sm:text-xl font-bold text-gray-300">
              Rankings
            </h2>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Large Thumbnail - Left Side */}
          {featuredHeadline?.slug?.current ? (
            <Link
              href={`/headlines/${featuredHeadline.slug.current}`}
              className="lg:col-span-2 lg:row-span-2 group"
            >
              <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                {featuredHeadline.coverImage?.asset ? (
                  <Image
                    src={urlFor(featuredHeadline.coverImage).width(800).url()}
                    alt={featuredHeadline.title}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                <div className="relative h-full flex flex-col justify-between p-8">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      <span className="text-white text-sm font-semibold uppercase tracking-wider">
                        Featured
                      </span>
                    </div>
                    <svg
                      className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                      {featuredHeadline.title}
                    </h3>
                    {featuredHeadline.summary && (
                      <p className="text-gray-300 text-base line-clamp-3 leading-relaxed">
                        {featuredHeadline.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/headlines"
              className="lg:col-span-2 lg:row-span-2 group"
            >
              <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-gray-900/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                <div className="relative h-full flex flex-col justify-between p-8">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      <span className="text-white text-sm font-semibold uppercase tracking-wider">
                        Breaking
                      </span>
                    </div>
                    <svg
                      className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                      Latest NFL Headlines & Breaking News
                    </h3>
                    <p className="text-gray-300 text-base line-clamp-3 leading-relaxed">
                      Stay updated with the latest NFL news, trades, and
                      breaking stories
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Right Side - Two Stacked Cards */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Top Right Card - Power Rankings */}
            <Link href="/power-rankings" className="flex-1 group">
              <div className="relative h-full min-h-[240px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                <div className="absolute inset-0 bg-gray-900/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="relative h-full flex flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex items-center px-3 py-1 bg-gray-800 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      <span className="text-white text-xs font-semibold">
                        Live Rankings
                      </span>
                    </div>
                    <svg
                      className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-gray-300 transition-colors duration-300">
                      NFL Power Rankings
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      Weekly team rankings with expert analysis
                    </p>

                    {/* Top 3 Teams Preview */}
                    {topTeams.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Top 3:</span>
                        <div className="flex -space-x-1">
                          {topTeams
                            .slice(0, 3)
                            .map((team: any, index: number) => (
                              <div key={team._id} className="relative">
                                {team.teamLogo?.asset ? (
                                  <Image
                                    src={urlFor(team.teamLogo)
                                      .width(24)
                                      .height(24)
                                      .url()}
                                    alt={team.teamName}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full bg-white/10"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      #{team.rank}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-xs text-black font-bold">
                                    {index + 1}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* Bottom Right Card - Latest News */}
            {latestHeadlines.length > 0 && latestHeadlines[0] ? (
              <Link
                href={
                  latestHeadlines[0].slug?.current
                    ? `/headlines/${latestHeadlines[0].slug.current}`
                    : "/headlines"
                }
                className="flex-1 group"
              >
                <div className="relative h-full min-h-[240px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {latestHeadlines[0].coverImage?.asset ? (
                    <Image
                      src={urlFor(latestHeadlines[0].coverImage)
                        .width(400)
                        .url()}
                      alt={latestHeadlines[0].title}
                      fill
                      className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center px-3 py-1 bg-gray-800 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-white text-xs font-semibold">
                          Latest
                        </span>
                      </div>
                      <svg
                        className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-white line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                        {latestHeadlines[0].title}
                      </h3>
                      {latestHeadlines[0].summary && (
                        <p className="text-gray-300 text-sm line-clamp-2 mt-2">
                          {latestHeadlines[0].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/standings" className="flex-1 group">
                <div className="relative h-full min-h-[240px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900/60 to-gray-900/60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center px-3 py-1 bg-gray-800 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-white text-xs font-semibold">
                          Standings
                        </span>
                      </div>
                      <svg
                        className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-white group-hover:text-gray-300 transition-colors duration-300">
                        NFL Standings
                      </h3>
                      <p className="text-gray-300 text-sm mt-2">
                        Current division standings and playoff race
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { client } from "@/sanity/lib/client";
import { powerRankingsQuery } from "@/sanity/lib/queries";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/lib/image";
import type { PowerRankingTeam, MovementIndicator } from "@/types";

export const revalidate = 60;

// Helper function to calculate team movement
function getMovementIndicator(change: number): MovementIndicator {
  if (change > 0) {
    return { symbol: "▲", color: "text-green-400" };
  } else if (change < 0) {
    return { symbol: "▼", color: "text-red-500" };
  } else {
    return { symbol: "–", color: "text-gray-400" };
  }
}

export default async function PowerRankingsPage() {
  try {
    const rankings: PowerRankingTeam[] = await client.fetch(powerRankingsQuery);

    // Handle empty state
    if (!rankings || rankings.length === 0) {
      return (
        <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              No Rankings Available
            </h1>
            <p className="text-gray-400 text-lg">
              Power rankings will be published soon. Check back later!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white">
            NFL Power Rankings
          </h1>
          <div className="w-24 h-1 bg-white mx-auto mt-6 mb-6"></div>
          <p className="text-xl text-gray-300 font-medium">
            Latest rankings updated weekly • {rankings.length} teams
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-black rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            <span className="text-sm text-green-400 font-semibold">
              Live Rankings
            </span>
          </div>
        </header>

        <div className="space-y-12 max-w-3xl mx-auto">
          {rankings.map((team) => {
            const {
              _id,
              rank,
              previousRank,
              teamColor,
              teamName,
              teamLogo,
              summary,
              body,
            } = team;
            const change = previousRank ? previousRank - rank : 0;
            const movement = getMovementIndicator(change);

            return (
              <article key={_id} className="group">
                {/* Compact Team Header */}
                <div className="relative bg-black p-3">
                  {/* Team Color Accent */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: teamColor || "#6366f1" }}
                  />

                  <div className="flex items-center gap-4">
                    {/* Rank Display */}
                    <div className="flex flex-col items-center min-w-[60px] bg-gray-900 rounded-lg p-2">
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
                  {Array.isArray(body) && body.length > 0 && (
                    <div className="text-2xl text-gray-200 leading-relaxed">
                      <PortableText value={body} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching power rankings:", error);
    return (
      <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Error Loading Rankings
          </h1>
          <p className="text-gray-400 text-lg">
            Unable to load power rankings. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}

import { client } from "@/sanity/lib/client";
import Link from 'next/link';
import { powerRankingsLiveQuery, powerRankingsLatestSnapshotForSeasonQuery } from "@/lib/queries/power-rankings";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { portableTextComponents } from "@/lib/portabletext-components";
import type { PowerRankingsDoc, PowerRankingEntry, MovementIndicator } from "@/types";
import { gradientClassForTeam } from "@/lib/team-utils";
import { fetchTeamRecords, shortRecord } from "@/lib/team-records";
import { getActiveSeason } from "@/lib/season";
import { teamCodeFromName } from "@/lib/team-utils";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
  description: 'Follow the latest NFL Power Rankings updated each week for all 32 teams. See who is rising or falling with fresh commentary on every squad.',
  openGraph: {
    title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
    description: 'Weekly updated rankings for all 32 NFL teams with movement notes and analysis.',
    url: 'https://thegamesnap.com/power-rankings',
    type: 'website',
  },
  alternates: { canonical: 'https://thegamesnap.com/power-rankings' },
};

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
    const liveDoc: PowerRankingsDoc | null = await client.fetch(powerRankingsLiveQuery);
    const season = liveDoc?.seasonYear ?? (await getActiveSeason());
    const records = await fetchTeamRecords(season);
    const latestSnapshot: { seasonYear: number; weekNumber?: number; playoffRound?: string; rankings?: { rank?: number; teamAbbr?: string; teamName?: string }[] } | null =
      liveDoc?.seasonYear
        ? await client.fetch(powerRankingsLatestSnapshotForSeasonQuery, { season: liveDoc.seasonYear })
        : null;

    // Handle empty state
    if (!liveDoc?.rankings || liveDoc.rankings.length === 0) {
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
            Latest rankings updated weekly • {liveDoc.rankings.length} teams
          </p>
          {(latestSnapshot?.weekNumber || latestSnapshot?.playoffRound) && (
            <div className="mt-4">
              <Link
                href={`/power-rankings/${season}/${latestSnapshot.playoffRound ? latestSnapshot.playoffRound.toLowerCase() : `week-${latestSnapshot.weekNumber}`}`}
                className="inline-block text-sm px-3 py-2 rounded bg-white text-black font-medium hover:bg-gray-200 transition-colors"
              >
                View This Week’s Edition →
              </Link>
            </div>
          )}
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-black rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            <span className="text-sm text-green-400 font-semibold">
              Live Rankings
            </span>
          </div>
        </header>

        <div className="space-y-12 max-w-3xl mx-auto">
          {liveDoc.rankings
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((team: PowerRankingEntry, index: number) => {
            const rank = team.rank;
            const teamName = team.teamName || team.team?.title || "";
            const teamLogo = team.teamLogo;
            const key = `${team.teamAbbr || teamName}-${rank}-${index}`;
            const prevRank =
              typeof team.prevRankOverride === "number"
                ? team.prevRankOverride
                : latestSnapshot?.rankings?.find((t) => (t.teamAbbr || t.teamName) === (team.teamAbbr || teamName))?.rank;
            const change = typeof team.movementOverride === "number" ? team.movementOverride : typeof prevRank === "number" ? prevRank - rank : 0;
            const movement = getMovementIndicator(change);

            return (
              <article key={key} className="group">
                {/* Compact Team Header */}
                <div className="relative bg-black p-3">
                  {/* Team Color Accent: auto from team name */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${gradientClassForTeam(teamName)}`} />

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
                    {teamLogo?.asset?.url && (
                      <div className="flex-shrink-0">
                        <Image
                          src={teamLogo.asset.url}
                          alt={(teamLogo as { alt?: string })?.alt || `${teamName} logo`}
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
                        <div className="flex flex-col items-start">
                          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{teamName}</h2>
                          {(() => {
                            const abbr = team.teamAbbr || teamCodeFromName(teamName);
                            const rec = shortRecord(abbr ? records.get(abbr) : undefined);
                            return rec ? (<span className="text-xs text-white/60 mt-0.5">{rec}</span>) : null;
                          })()}
                        </div>

                        {/* Movement Indicator */}
                        <div className="flex flex-col items-center min-w-[50px] rounded-lg p-2">
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
                  {/* Summary intentionally hidden on live page (used for SEO only) */}
                  {Array.isArray(team.analysis) && team.analysis.length > 0 && (
                    <div className="text-2xl text-gray-200 leading-relaxed">
                      <PortableText value={team.analysis} components={portableTextComponents} />
                    </div>
                  )}
                  {!team.analysis && team.note && (
                    <p className="text-lg text-gray-200 leading-relaxed">{team.note}</p>
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

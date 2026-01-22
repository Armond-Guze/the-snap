import { client } from "@/sanity/lib/client";
import Link from 'next/link';
import { powerRankingsLiveQuery, powerRankingsLatestSnapshotForSeasonQuery } from "@/lib/queries/power-rankings";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { portableTextComponents } from "@/lib/portabletext-components";
import type { HeadlineListItem, PowerRankingsDoc, PowerRankingEntry, MovementIndicator } from "@/types";
import { gradientClassForTeam } from "@/lib/team-utils";
import { fetchTeamRecords, shortRecord } from "@/lib/team-records";
import { getActiveSeason } from "@/lib/season";
import { teamCodeFromName } from "@/lib/team-utils";
import type { Metadata } from 'next';
import RelatedArticles from '@/app/components/RelatedArticles';
import { AVATAR_SIZES, ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import { formatArticleDate } from '@/lib/date-utils';

const TEAM_COLOR_CLASSES: Record<string, string> = {
  '#97233F': 'text-[#97233F]',
  '#A71930': 'text-[#A71930]',
  '#241773': 'text-[#241773]',
  '#00338D': 'text-[#00338D]',
  '#0085CA': 'text-[#0085CA]',
  '#0B162A': 'text-[#0B162A]',
  '#FB4F14': 'text-[#FB4F14]',
  '#311D00': 'text-[#311D00]',
  '#041E42': 'text-[#041E42]',
  '#0076B6': 'text-[#0076B6]',
  '#203731': 'text-[#203731]',
  '#03202F': 'text-[#03202F]',
  '#002C5F': 'text-[#002C5F]',
  '#006778': 'text-[#006778]',
  '#E31837': 'text-[#E31837]',
  '#000000': 'text-[#000000]',
  '#0080C6': 'text-[#0080C6]',
  '#003594': 'text-[#003594]',
  '#008E97': 'text-[#008E97]',
  '#4F2683': 'text-[#4F2683]',
  '#002244': 'text-[#002244]',
  '#D3BC8D': 'text-[#D3BC8D]',
  '#0B2265': 'text-[#0B2265]',
  '#125740': 'text-[#125740]',
  '#004C54': 'text-[#004C54]',
  '#FFB612': 'text-[#FFB612]',
  '#AA0000': 'text-[#AA0000]',
  '#D50A0A': 'text-[#D50A0A]',
  '#0C2340': 'text-[#0C2340]',
  '#5A1414': 'text-[#5A1414]',
};

const getTeamColorClass = (color?: string | null) => {
  if (!color) return 'text-white';
  const normalized = color.toUpperCase();
  return TEAM_COLOR_CLASSES[normalized] ?? 'text-white';
};

export const metadata: Metadata = {
  title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
  description: 'Follow the latest NFL Power Rankings updated each week for all 32 teams. See who is rising or falling with fresh commentary on every squad.',
  openGraph: {
    title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
    description: 'Weekly updated rankings for all 32 NFL teams with movement notes and analysis.',
    url: 'https://thegamesnap.com/articles/power-rankings',
    type: 'website',
  },
  alternates: { canonical: 'https://thegamesnap.com/articles/power-rankings' },
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

export default async function PowerRankingsArticlePage() {
  try {
    const [liveDoc, season, otherContent] = await Promise.all([
      client.fetch<PowerRankingsDoc | null>(powerRankingsLiveQuery),
      getActiveSeason(),
      client.fetch<HeadlineListItem[]>(
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
          author-> { name },
          featuredImage { asset->{ url } },
          coverImage { asset->{ url } },
          image { asset->{ url } }
        }`
      )
    ]);
    const activeSeason = liveDoc?.seasonYear ?? season;
    const records = await fetchTeamRecords(activeSeason);
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
      <main className="bg-black text-white min-h-screen">
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <article className="lg:col-span-2 flex flex-col">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{liveDoc.title || 'NFL Power Rankings'}</h1>
              <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
                {liveDoc.author?.image?.asset?.url && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={liveDoc.author.image.asset.url}
                      alt={(liveDoc.author.image as { alt?: string })?.alt || liveDoc.author?.name || 'Author'}
                      fill
                      sizes={AVATAR_SIZES}
                      className="object-cover"
                    />
                  </div>
                )}
                <span>
                  By {liveDoc.author?.name || 'The Snap'} •{' '}
                  {formatArticleDate(liveDoc.publishedAt || liveDoc.date)}
                </span>
                <span className="text-gray-500">•</span>
                <span>Latest rankings updated weekly • {liveDoc.rankings.length} teams</span>
              </div>
              {(latestSnapshot?.weekNumber || latestSnapshot?.playoffRound) && (
                <div className="mt-4">
                  <Link
                    href={`/articles/power-rankings/${activeSeason}/${latestSnapshot.playoffRound ? latestSnapshot.playoffRound.toLowerCase() : `week-${latestSnapshot.weekNumber}`}`}
                    className="inline-block text-sm px-3 py-2 rounded bg-white text-black font-medium hover:bg-gray-200 transition-colors"
                  >
                    View This Week’s Edition →
                  </Link>
                </div>
              )}
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-black rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                <span className="text-sm text-green-400 font-semibold">Live Rankings</span>
              </div>
            </header>

            {liveDoc.coverImage?.asset?.url && (
              <div className="w-full mb-6">
                <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                  <Image
                    src={liveDoc.coverImage.asset.url}
                    alt={(liveDoc.coverImage as { alt?: string })?.alt || liveDoc.title || 'NFL Power Rankings'}
                    fill
                    sizes={ARTICLE_COVER_SIZES}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
                {liveDoc.summary && (
                  <p className="mt-4 text-lg text-gray-300 leading-relaxed max-w-3xl">
                    {liveDoc.summary}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-12">
              {liveDoc.rankings
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((team: PowerRankingEntry, index: number) => {
                  const rank = team.rank;
                  const teamName = team.teamName || team.team?.title || "";
                  const teamLogo = team.teamLogo;
                  const teamNameClass = getTeamColorClass(team.teamColor);
                  const key = `${team.teamAbbr || teamName}-${rank}-${index}`;
                  const prevRank =
                    typeof team.prevRankOverride === "number"
                      ? team.prevRankOverride
                      : latestSnapshot?.rankings?.find((t) => (t.teamAbbr || t.teamName) === (team.teamAbbr || teamName))?.rank;
                  const change = typeof team.movementOverride === "number" ? team.movementOverride : typeof prevRank === "number" ? prevRank - rank : 0;
                  const movement = getMovementIndicator(change);

                  return (
                    <article key={key} className="group">
                      <div className="relative bg-black p-3">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${gradientClassForTeam(teamName)}`} />

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center min-w-[60px] bg-black rounded-lg p-2">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Rank</span>
                            <span className="text-2xl font-black text-white">{rank}</span>
                          </div>

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

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col items-start">
                                <h2 className={`text-xl sm:text-2xl font-bold truncate ${teamNameClass}`}>{teamName}</h2>
                                {(() => {
                                  const abbr = team.teamAbbr || teamCodeFromName(teamName);
                                  const rec = shortRecord(abbr ? records.get(abbr) : undefined);
                                  return rec ? (<span className="text-xs text-white/60 mt-0.5">{rec}</span>) : null;
                                })()}
                              </div>

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

                      <div className="mt-3 bg-black p-6">
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
          </article>

          <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
            <RelatedArticles currentSlug="power-rankings" articles={otherContent} />
          </aside>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Power Rankings error:', error);
    return (
      <div className="px-4 py-16 sm:px-6 lg:px-12 bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-400 text-lg">
            Please try again later.
          </p>
        </div>
      </div>
    );
  }
}

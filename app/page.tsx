// import VideoOfTheWeek from "./components/VideoOfTheWeek";
import Headlines from "./components/Headlines";
import RankingsSection from "./components/RankingsSection";
import FantasySection from "./components/FantasySection";
import MoreHeadlinesSection from "./components/MoreHeadlinesSection";
// import TrendingTopics from "./components/TrendingTopics";
import GameSchedule from "./components/GameSchedule";
import GoogleAds from "./components/GoogleAds"; // Single enabled ad for AdSense review
import { fetchTeamRecords, shortRecord, TeamRecordDoc } from "@/lib/team-records";
import { getScheduleWeekOrCurrent, TEAM_META, bucketLabelFor, EnrichedGame } from "@/lib/schedule";
import { fetchNFLStandingsWithFallback } from '@/lib/nfl-api';
import { Metadata } from 'next'
import Link from 'next/link'
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "The Game Snap (The Snap) - NFL News, Power Rankings, Standings & Analysis",
  description: "The Game Snap (The Snap) brings the latest NFL news, power rankings, standings, and game schedules. Expert analysis, breaking stories, and comprehensive NFL coverage all in one place.",
  openGraph: {
    title: "The Game Snap (The Snap) - NFL News, Power Rankings & Analysis",
    description: "The Game Snap (The Snap) brings the latest NFL news, power rankings, standings, and game schedules. Expert analysis and comprehensive NFL coverage.",
    url: 'https://thegamesnap.com',
    images: [
  {
    url: 'https://thegamesnap.com/images/thesnap-logo-transparent.png',
    width: 1200,
    height: 630,
    alt: 'The Snap - NFL News and Analysis Homepage',
  },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Game Snap (The Snap) - NFL News, Power Rankings & Analysis",
    description: "The Game Snap (The Snap) brings the latest NFL news, power rankings, standings, and game schedules.",
  images: ['https://thegamesnap.com/images/thesnap-logo-transparent.png'],
  },
}

// Keep the homepage reasonably fresh during the season; adjust higher in offseason
export const revalidate = 60;
const HEADLINES_PAGE_SIZE = 24;
const HEADLINE_ARCHIVE_COUNT_QUERY = `
  count(*[
    ( _type == "article" && format == "headline" && published == true ) ||
    ( _type == "headline" && published == true )
  ])
`;

function archiveHref(page: number): string {
  return page <= 1 ? "/headlines" : `/headlines/page/${page}`;
}

function archivePages(totalPages: number): number[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  return [1, 2, 3, totalPages];
}

export default async function Home() {
  const [recMap, headlineCount] = await Promise.all([
    fetchFreshRecords(2025),
    fetchHeadlineArchiveCount(),
  ]);
  const games = await buildHomepageGames(recMap);
  const totalPages = Math.max(1, Math.ceil(headlineCount / HEADLINES_PAGE_SIZE));
  const pages = archivePages(totalPages);
  const deferredSectionStyle = { contentVisibility: "auto", containIntrinsicSize: "1200px" } as const;

  return (
    <main className="home-gradient min-h-screen">
      <GameSchedule games={games} />
      <Headlines hideSummaries />
      <GoogleAds />
      <div style={deferredSectionStyle}>
        <RankingsSection hideSummaries />
      </div>
      <div style={deferredSectionStyle}>
        <FantasySection hideSummaries />
      </div>
      <div style={deferredSectionStyle}>
        <MoreHeadlinesSection hideSummaries />
      </div>
      <section className="px-6 lg:px-8 2xl:px-12 3xl:px-16 pb-14" style={deferredSectionStyle}>
    <div className="mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem]">
      <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Headlines Archive</p>
            <p className="text-sm text-white/70">
              {totalPages > 1 ? `Browse ${totalPages} pages of headline history` : "You are viewing the latest page"}
            </p>
          </div>
          <Link href="/headlines" className="text-xs text-white/60 hover:text-white transition-colors">
            View all
          </Link>
        </div>
        {totalPages > 1 && (
          <nav aria-label="Homepage headlines pagination" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white/70">Page</span>
            {pages.map((page, idx) => {
              const prev = pages[idx - 1];
              const showGap = idx > 0 && prev && page - prev > 1;
              return (
                <div key={`archive-page-${page}`} className="contents">
                  {showGap && <span className="px-1 text-white/30">...</span>}
                  <Link
                    href={archiveHref(page)}
                    aria-current={page === 1 ? "page" : undefined}
                    className={
                      page === 1
                        ? "rounded-lg bg-white px-3 py-1.5 font-semibold text-black"
                        : "rounded-lg bg-white/10 px-3 py-1.5 text-white/90 transition-colors hover:bg-white/20"
                    }
                  >
                    {page}
                  </Link>
                </div>
              );
            })}
            <Link
              href={archiveHref(2)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 transition-colors hover:bg-white/20"
            >
              Next
            </Link>
            <Link
              href={archiveHref(totalPages)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 transition-colors hover:bg-white/20"
            >
              Last
            </Link>
          </nav>
        )}
      </div>
    </div>
  </section>
      {/* <VideoOfTheWeek textureSrc="/images/texture-image.jpg" /> */}
      {/* <TrendingTopics textureSrc="/images/texture-image.jpg" /> */}
  {/* Analytics now handled globally via AnalyticsGate in layout */}
    </main>
  );
}

type GameScheduleCard = Parameters<typeof GameSchedule>[0]['games'][number];

async function buildHomepageGames(recMap: Map<string, TeamRecordDoc>): Promise<GameScheduleCard[]> {
  const { games } = await getScheduleWeekOrCurrent();
  return filterUpcomingGames(games.map((g) => mapEnrichedGameToCard(g, recMap)));
}

function mapEnrichedGameToCard(game: EnrichedGame, recMap: Map<string, TeamRecordDoc>): GameScheduleCard {
  const homeMeta = TEAM_META[game.home];
  const awayMeta = TEAM_META[game.away];
  const isPrimetime = computePrimetimeFlag(game.dateUTC, game.week, game.home, game.away);
  return {
    _id: game.gameId,
    homeTeam: homeMeta?.name || game.home,
    awayTeam: awayMeta?.name || game.away,
    homeAbbr: game.home,
    awayAbbr: game.away,
    homeLogoUrl: homeMeta?.logo,
    awayLogoUrl: awayMeta?.logo,
    homeRecord: formatRecord(recMap.get(game.home)),
    awayRecord: formatRecord(recMap.get(game.away)),
    gameDate: game.dateUTC,
    tvNetwork: game.network,
    gameImportance: isPrimetime ? 'primetime' : undefined,
    week: game.week,
  };
}

function filterUpcomingGames(cards: GameScheduleCard[]): GameScheduleCard[] {
  if (!cards.length) return cards;
  const ordered = [...cards].sort((a, b) => Date.parse(a.gameDate) - Date.parse(b.gameDate));
  const windowMs = 6 * 60 * 60 * 1000;
  const now = Date.now();
  const upcoming = ordered.filter((card) => Date.parse(card.gameDate) >= now - windowMs);
  return (upcoming.length ? upcoming : ordered);
}


function computePrimetimeFlag(dateUTC: string, week: number, home: string, away: string): boolean {
  const pseudo: EnrichedGame = {
    gameId: `${week}-${away}-${home}`,
    week,
    dateUTC,
    home,
    away,
    status: 'SCHEDULED'
  } as EnrichedGame;
  const label = bucketLabelFor(pseudo);
  return label === 'Thursday Night' || label === 'Sunday Night' || label === 'Monday Night';
}

function formatRecord(record?: TeamRecordDoc): string | undefined {
  const value = shortRecord(record);
  return value ? value : undefined;
}

async function fetchFreshRecords(season: number): Promise<Map<string, TeamRecordDoc>> {
  const stored = await fetchTeamRecords(season);
  if (stored.size === 32) return stored;

  try {
    const live = await fetchNFLStandingsWithFallback();
    if (live?.length) {
      const nameToAbbr = new Map<string, string>(
        Object.entries(TEAM_META).map(([abbr, meta]) => [meta.name, abbr])
      );

      const map = new Map<string, TeamRecordDoc>();
      for (const team of live) {
        const abbr = nameToAbbr.get(team.teamName);
        if (!abbr) continue;
        map.set(abbr, {
          _id: `live-${abbr}-${season}`,
          teamAbbr: abbr,
          season,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
        });
      }

      if (map.size > 0) return map;
    }
  } catch (err) {
    console.warn('[home] live standings fallback to cached records', err);
  }

  return stored;
}

async function fetchHeadlineArchiveCount(): Promise<number> {
  try {
    const count = await client.fetch<number>(HEADLINE_ARCHIVE_COUNT_QUERY);
    return Number.isFinite(count) ? count : 0;
  } catch (err) {
    console.warn("[home] headline archive count failed", err);
    return 0;
  }
}

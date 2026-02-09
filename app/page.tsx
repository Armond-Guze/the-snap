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

export default async function Home() {
  const recMap = await fetchFreshRecords(2025);
  const games = await buildHomepageGames(recMap);

  return (
    <main className="home-gradient min-h-screen">
  <GameSchedule games={games} />
  <GoogleAds />
  <Headlines hideSummaries />
  <RankingsSection hideSummaries />
  <FantasySection hideSummaries />
  <MoreHeadlinesSection hideSummaries />
  <section className="px-6 lg:px-8 2xl:px-12 3xl:px-16 pb-14">
    <div className="mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem]">
      <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">More Headlines</p>
            <p className="text-sm text-white/70">Browse additional pages</p>
          </div>
          <Link href="/headlines" className="text-xs text-white/60 hover:text-white transition-colors">
            View all
          </Link>
        </div>
        <nav aria-label="Homepage headlines pagination" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white/70">Page</span>
          <Link
            href="/headlines"
            aria-current="page"
            className="rounded-lg bg-white text-black px-3 py-1.5 font-semibold"
          >
            1
          </Link>
          <Link href="/headlines/page/2" className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 hover:bg-white/20 transition-colors">2</Link>
          <Link href="/headlines/page/3" className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 hover:bg-white/20 transition-colors">3</Link>
          <span className="px-1 text-white/30">...</span>
          <Link href="/headlines/page/2" className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 hover:bg-white/20 transition-colors">Next</Link>
          <Link href="/headlines/page/3" className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 hover:bg-white/20 transition-colors">Last</Link>
        </nav>
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

      if (map.size === 32) return map;
    }
  } catch (err) {
    console.warn('[home] live standings fallback to Sanity', err);
  }

  return fetchTeamRecords(season);
}

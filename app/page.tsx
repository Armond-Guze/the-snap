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
import { fetchSportsDataCurrentWeek, fetchSportsDataScoresByWeek, SportsDataScore } from "@/lib/sportsdata-client";
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The Snap - NFL News, Power Rankings, Standings & Analysis",
  description: "Get the latest NFL news, power rankings, standings, and game schedules. Expert analysis, breaking stories, and comprehensive NFL coverage all in one place.",
  keywords: "NFL news, NFL power rankings, NFL standings, NFL schedule, football analysis, NFL draft, fantasy football, NFL scores, NFL playoffs",
  openGraph: {
    title: "The Snap - NFL News, Power Rankings & Analysis",
    description: "Get the latest NFL news, power rankings, standings, and game schedules. Expert analysis and comprehensive NFL coverage.",
    url: 'https://thegamesnap.com',
    images: [
  {
    url: '/images/thesnap-logo-new copy.jpg',
    width: 1200,
    height: 630,
    alt: 'The Snap - NFL News and Analysis Homepage',
  },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Snap - NFL News, Power Rankings & Analysis",
    description: "Get the latest NFL news, power rankings, standings, and game schedules.",
  images: ['/images/thesnap-logo-new copy.jpg'],
  },
}

export default async function Home() {
  const recMap = await fetchTeamRecords(2025);
  const games = await buildHomepageGames(recMap);

  return (
    <main className="home-gradient min-h-screen">
  <GameSchedule games={games} />
  <GoogleAds />
  <Headlines hideSummaries />
  <RankingsSection hideSummaries />
  <FantasySection hideSummaries />
  <MoreHeadlinesSection hideSummaries />
      {/* <VideoOfTheWeek textureSrc="/images/texture-image.jpg" /> */}
      {/* <TrendingTopics textureSrc="/images/texture-image.jpg" /> */}
  {/* Analytics now handled globally via AnalyticsGate in layout */}
    </main>
  );
}

type GameScheduleCard = Parameters<typeof GameSchedule>[0]['games'][number];

async function buildHomepageGames(recMap: Map<string, TeamRecordDoc>): Promise<GameScheduleCard[]> {
  const sportsDataGames = await trySportsDataCarousel(recMap);
  if (sportsDataGames?.length) return sportsDataGames;
  const { games } = await getScheduleWeekOrCurrent();
  return filterUpcomingGames(games.map((g) => mapEnrichedGameToCard(g, recMap)));
}

async function trySportsDataCarousel(recMap: Map<string, TeamRecordDoc>): Promise<GameScheduleCard[] | null> {
  try {
    const week = await fetchSportsDataCurrentWeek();
    if (!week || week < 1) return null;
    const scores = await fetchSportsDataScoresByWeek(week);
    if (!scores?.length) return null;
    const cards = scores
      .filter((game) => game.HomeTeam && game.AwayTeam)
      .map((game) => mapSportsDataGameToCard(game, recMap));
    if (!cards.length) return null;
    return filterUpcomingGames(cards);
  } catch (error) {
    console.warn('[home] SportsData feed unavailable, falling back to static schedule', error);
    return null;
  }
}

function mapSportsDataGameToCard(game: SportsDataScore, recMap: Map<string, TeamRecordDoc>): GameScheduleCard {
  const homeAbbr = game.HomeTeam?.toUpperCase() || 'HOME';
  const awayAbbr = game.AwayTeam?.toUpperCase() || 'AWAY';
  const dateUTC = normalizeDate(game.DateTime || game.Date);
  const isPrimetime = computePrimetimeFlag(dateUTC, game.Week, homeAbbr, awayAbbr);
  const homeMeta = TEAM_META[homeAbbr];
  const awayMeta = TEAM_META[awayAbbr];
  return {
    _id: game.GameKey || `${game.Season || 'season'}-${game.Week}-${awayAbbr}-${homeAbbr}`,
    homeTeam: homeMeta?.name || homeAbbr,
    awayTeam: awayMeta?.name || awayAbbr,
    homeAbbr,
    awayAbbr,
    homeLogoUrl: homeMeta?.logo,
    awayLogoUrl: awayMeta?.logo,
    homeRecord: formatRecord(recMap.get(homeAbbr)),
    awayRecord: formatRecord(recMap.get(awayAbbr)),
    gameDate: dateUTC,
    tvNetwork: game.Channel || undefined,
    gameImportance: isPrimetime ? 'primetime' : undefined,
    week: game.Week,
  };
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

function normalizeDate(value?: string): string {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
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
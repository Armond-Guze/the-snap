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
import { isSportsDataEnabled } from "@/lib/config/sportsdata";
import { fetchNFLStandingsWithFallback } from '@/lib/nfl-api';
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The Snap - NFL News, Power Rankings, Standings & Analysis",
  description: "Get the latest NFL news, power rankings, standings, and game schedules. Expert analysis, breaking stories, and comprehensive NFL coverage all in one place.",
  openGraph: {
    title: "The Snap - NFL News, Power Rankings & Analysis",
    description: "Get the latest NFL news, power rankings, standings, and game schedules. Expert analysis and comprehensive NFL coverage.",
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
    title: "The Snap - NFL News, Power Rankings & Analysis",
    description: "Get the latest NFL news, power rankings, standings, and game schedules.",
  images: ['https://thegamesnap.com/images/thesnap-logo-transparent.png'],
  },
}

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
      {/* <VideoOfTheWeek textureSrc="/images/texture-image.jpg" /> */}
      {/* <TrendingTopics textureSrc="/images/texture-image.jpg" /> */}
  {/* Analytics now handled globally via AnalyticsGate in layout */}
    </main>
  );
}

type GameScheduleCard = Parameters<typeof GameSchedule>[0]['games'][number];

async function buildHomepageGames(recMap: Map<string, TeamRecordDoc>): Promise<GameScheduleCard[]> {
  if (isSportsDataEnabled()) {
    const sportsDataGames = await trySportsDataCarousel(recMap);
    if (sportsDataGames?.length) return sportsDataGames;
  }
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

  // If the incoming string already includes a timezone/offset, trust it directly.
  const hasExplicitOffset = /[zZ]|[+-]\d\d:?\d\d$/.test(value);
  if (hasExplicitOffset) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  // SportsDataIO supplies naive datetimes in Eastern Time (no offset). Convert them to UTC.
  const isoFromEastern = convertEasternNaiveToUtc(value);
  if (isoFromEastern) return isoFromEastern;

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
}

function convertEasternNaiveToUtc(value: string): string | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const baseUtcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    second ? Number(second) : 0
  );

  const baseDate = new Date(baseUtcMs);
  const easternString = baseDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const easternDate = new Date(easternString);
  if (Number.isNaN(easternDate.getTime())) return null;

  const offsetMinutes = (baseDate.getTime() - easternDate.getTime()) / 60000;
  const adjusted = new Date(baseUtcMs + offsetMinutes * 60000);
  return adjusted.toISOString();
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
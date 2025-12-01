// import VideoOfTheWeek from "./components/VideoOfTheWeek";
import Headlines from "./components/Headlines";
import RankingsSection from "./components/RankingsSection";
import FantasySection from "./components/FantasySection";
import MoreHeadlinesSection from "./components/MoreHeadlinesSection";
// import TrendingTopics from "./components/TrendingTopics";
import GameSchedule from "./components/GameSchedule";
import GoogleAds from "./components/GoogleAds"; // Single enabled ad for AdSense review
import { fetchTeamRecords, shortRecord } from "@/lib/team-records";
import { getScheduleWeekOrCurrent, TEAM_META, bucketLabelFor } from "@/lib/schedule";
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
  const [{ games }, recMap] = await Promise.all([
    getScheduleWeekOrCurrent(),
    fetchTeamRecords(2025)
  ]);

  const now = Date.now();
  const upcomingGames = games
    .filter((g) => new Date(g.dateUTC).getTime() >= now - 6 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.dateUTC).getTime() - new Date(b.dateUTC).getTime());

  const weekGames = (upcomingGames.length ? upcomingGames : games).map((g) => {
    const homeMeta = TEAM_META[g.home];
    const awayMeta = TEAM_META[g.away];
    const importanceLabel = bucketLabelFor(g);
    const isPrimetime = importanceLabel === 'Thursday Night' || importanceLabel === 'Sunday Night' || importanceLabel === 'Monday Night';

    return {
      _id: g.gameId,
      homeTeam: homeMeta?.name || g.home,
      awayTeam: awayMeta?.name || g.away,
      homeAbbr: g.home,
      awayAbbr: g.away,
      homeLogoUrl: homeMeta?.logo,
      awayLogoUrl: awayMeta?.logo,
      homeRecord: shortRecord(recMap.get(g.home)) || undefined,
      awayRecord: shortRecord(recMap.get(g.away)) || undefined,
      gameDate: g.dateUTC,
      tvNetwork: g.network,
      gameImportance: isPrimetime ? 'primetime' : undefined,
      week: g.week,
    };
  });

  return (
    <main className="home-gradient min-h-screen">
  <GameSchedule games={weekGames} />
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
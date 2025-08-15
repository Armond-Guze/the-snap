// import VideoOfTheWeek from "./components/VideoOfTheWeek";
import Headlines from "./components/Headlines";
import BentoGrid from "./components/BentoGrid";
import RankingsBentoGrid from "./components/RankingsBentoGrid";
import FantasyBentoGrid from "./components/FantasyBentoGrid";
// import TrendingTopics from "./components/TrendingTopics";
import GameSchedule from "./components/GameSchedule";
// import GoogleAds from "./components/GoogleAds";
import { client } from "@/sanity/lib/client";
import { featuredGamesQuery } from "@/sanity/lib/queries";
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
  url: '/images/logo--design copy.png',
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
  images: ['/images/logo--design copy.png'],
  },
}

export default async function Home() {
  const featuredGames = await client.fetch(featuredGamesQuery);

  return (
    <main className="min-h-screen">
  <GameSchedule games={featuredGames || []} />
  {/* <GoogleAds /> */}
  <Headlines textureSrc="/images/texture-image.jpg" hideSummaries />
  <RankingsBentoGrid textureSrc="/images/texture-image.jpg" hideSummaries />
      <FantasyBentoGrid textureSrc="/images/texture-image.jpg" hideSummaries />
      <BentoGrid textureSrc="/images/texture-image.jpg" hideSummaries />
      {/* <VideoOfTheWeek textureSrc="/images/texture-image.jpg" /> */}
      {/* <TrendingTopics textureSrc="/images/texture-image.jpg" /> */}
  {/* Analytics now handled globally via AnalyticsGate in layout */}
    </main>
  );
}
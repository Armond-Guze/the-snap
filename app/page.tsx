import VideoOfTheWeek from "./components/VideoOfTheWeek";
import Headlines from "./components/Headlines";
import BentoGrid from "./components/BentoGrid";
import TrendingTopics from "./components/TrendingTopics";
import GameSchedule from "./components/GameSchedule";
import { client } from "@/sanity/lib/client";
import { featuredGamesQuery } from "@/sanity/lib/queries";
import { Analytics } from "@vercel/analytics/next"
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
        url: '/images/the-snap-logo.png',
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
    images: ['/images/the-snap-logo.png'],
  },
}

export default async function Home() {
  const featuredGames = await client.fetch(featuredGamesQuery);

  return (
    <main className="min-h-screen">
  <GameSchedule games={featuredGames || []} />
  <Headlines textureSrc="/images/texture-image.jpg" />
      <BentoGrid textureSrc="/images/texture-image.jpg" />
      <VideoOfTheWeek textureSrc="/images/texture-image.jpg" />
      <TrendingTopics textureSrc="/images/texture-image.jpg" />
      <Analytics />
    </main>
  );
}
import VideoOfTheWeek from "./components/VideoOfTheWeek";
import Headlines from "./components/Headlines";
import BentoGrid from "./components/BentoGrid";
import TrendingTopics from "./components/TrendingTopics";
import NewsletterSignup from "./components/NewsletterSignup";
import GameSchedule from "./components/GameSchedule";
import { client } from "@/sanity/lib/client";
import { featuredGamesQuery } from "@/sanity/lib/queries";

export default async function Home() {
  const featuredGames = await client.fetch(featuredGamesQuery);

  return (
    <main className="min-h-screen bg-stadium-night">
      <GameSchedule games={featuredGames || []} />
      <Headlines />
      <BentoGrid />
      <VideoOfTheWeek />
      <TrendingTopics />
      <NewsletterSignup />
    </main>
  );
}
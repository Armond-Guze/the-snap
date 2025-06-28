import Cards from "./components/Cards";
import FeaturesSection from "./components/FeaturesSections";
import Headlines from "./components/Headlines";
import BentoGrid from "./components/BentoGrid";
import TrendingTopics from "./components/TrendingTopics";
import NewsletterSignup from "./components/NewsletterSignup";

export default function Home() {
  return (
    <main>
      <Headlines />
      <BentoGrid />
      <Cards />
      <FeaturesSection />
      <TrendingTopics />
      <NewsletterSignup />
    </main>
  );
}
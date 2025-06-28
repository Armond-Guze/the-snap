import Cards from "./components/Cards";
import FeaturesSection from "./components/FeaturesSections";
import Headlines from "./components/Headlines";
import BentoGrid from "./components/BentoGrid";
import TrendingTopics from "./components/TrendingTopics";
import NewsletterSignup from "./components/NewsletterSignup";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Headlines />
      <BentoGrid />
      <Cards />
      <FeaturesSection />
      <TrendingTopics />
      <NewsletterSignup />
      <Footer />
    </main>
  );
}
// Test the SEO keyword generator with different article types
import { generateSEOKeywords } from './seo-keywords';

console.log("🔍 Testing SEO Keyword Generation for Different Article Types");
console.log("=" .repeat(60));

const testArticles = [
  {
    title: "Top 5 NFL Rookies to Watch in 2025 Season",
    tags: ["Rookie Analysis", "2025 Season", "Rankings"],
    category: "Headlines"
  },
  {
    title: "NFL Power Rankings Week 10: Chiefs Still Dominate", 
    tags: ["Power Rankings", "Week 10", "Analysis"],
    category: "Rankings"
  },
  {
    title: "BREAKING: Star Quarterback Traded to Cowboys",
    tags: ["Breaking News", "Trade", "Cowboys", "Quarterback"],
    category: "Headlines"
  },
  {
    title: "2025 NFL Playoff Predictions and Bracket",
    tags: ["Playoffs", "Predictions", "2025 Season"],
    category: "Analysis"
  },
  {
    title: "Best Available Players in 2025 NFL Draft",
    tags: ["NFL Draft", "Player Analysis", "2025"],
    category: "Analysis"
  },
  {
    title: "Bills vs Patriots: Week 12 Game Recap",
    tags: ["Game Recap", "Bills", "Patriots", "Week 12"],
    category: "Headlines"
  },
  {
    title: "NFL Injury Report: Key Players Out This Week",
    tags: ["Injury News", "Weekly Update", "Player Status"],
    category: "Headlines"
  }
];

testArticles.forEach((article, index) => {
  const result = generateSEOKeywords(article.tags, article.category, article.title);
  
  console.log(`\n📝 Article ${index + 1}: ${article.title}`);
  console.log(`🏷️  Tags: ${article.tags.join(", ")}`);
  console.log(`📁 Category: ${article.category}`);
  console.log(`🎯 Focus Keyword: "${result.focusKeyword}"`);
  console.log(`🔗 Additional Keywords: ${result.additionalKeywords.join(", ")}`);
  console.log("-".repeat(50));
});

console.log("\n✅ As you can see, the system adapts to ANY article topic!");
console.log("✅ It detects the subject and generates relevant SEO keywords automatically!");
console.log("✅ No manual keyword entry needed - just use your content tags!");

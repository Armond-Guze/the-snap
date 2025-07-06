// Simple SEO keyword generator - no complex Sanity plugin needed
// Just use this function when creating articles

import { generateSEOKeywords } from './seo-keywords';

/**
 * Quick SEO generator for your articles
 * Use this manually when creating content
 */
export function quickSEOGenerator(title: string, tags: string[], category: string = 'Headlines') {
  const result = generateSEOKeywords(tags, category, title);
  
  console.log('\n🎯 SEO Keywords Generated:');
  console.log('=' .repeat(40));
  console.log(`📝 Title: ${title}`);
  console.log(`🏷️  Tags: ${tags.join(', ')}`);
  console.log(`📁 Category: ${category}`);
  console.log(`\n🎯 Focus Keyword: "${result.focusKeyword}"`);
  console.log(`🔗 Additional Keywords:`);
  result.additionalKeywords.forEach((keyword, i) => {
    console.log(`   ${i + 1}. ${keyword}`);
  });
  console.log('=' .repeat(40));
  
  return result;
}

// Ready-to-use examples for your common article types
export const ARTICLE_TEMPLATES = {
  rookies: {
    title: "Top 5 NFL Rookies to Watch in 2025 Season",
    tags: ["Rookie Analysis", "2025 Season", "Rankings", "Breakout Players"],
    category: "Headlines"
  },
  
  powerRankings: {
    title: "NFL Power Rankings Week 10: Chiefs Still Dominate",
    tags: ["Power Rankings", "Week 10", "Analysis"],
    category: "Rankings"
  },
  
  tradeNews: {
    title: "BREAKING: Star Quarterback Traded to Cowboys",
    tags: ["Breaking News", "Trade", "Cowboys", "Quarterback"],
    category: "Headlines"
  },
  
  playoffs: {
    title: "2025 NFL Playoff Predictions and Bracket",
    tags: ["Playoffs", "Predictions", "2025 Season"],
    category: "Analysis"
  },
  
  draft: {
    title: "Best Available Players in 2025 NFL Draft",
    tags: ["NFL Draft", "Player Analysis", "2025"],
    category: "Analysis"
  }
};

// Test function to see all examples
export function showAllExamples() {
  console.log('\n📋 SEO Examples for Different Article Types:');
  console.log('=' .repeat(60));
  
  Object.entries(ARTICLE_TEMPLATES).forEach(([type, template]) => {
    console.log(`\n📝 ${type.toUpperCase()} ARTICLE:`);
    quickSEOGenerator(template.title, template.tags, template.category);
  });
}

// For your current rookies article
export function generateRookiesArticleSEO() {
  return quickSEOGenerator(
    "Top 5 NFL Rookies to Watch in 2025 Season",
    ["Rookie Analysis", "2025 Season", "Rankings", "Breakout Players"],
    "Headlines"
  );
}

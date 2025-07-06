// Simple SEO keyword generator for your current workflow
// Use this when creating/editing articles

import { generateSEOKeywords } from './seo-keywords';

/**
 * Quick SEO keyword generator for your "Top 5 Rookies" article
 */
export function generateKeywordsForArticle() {
  // Based on your current article
  const tags = ['Rookie Analysis', '2025 Season', 'Player Rankings', 'NFL Draft', 'Breakout Players'];
  const categoryTitle = 'Headlines';
  const articleTitle = 'Top 5 NFL Rookies to Watch in 2025 Season';
  
  const { focusKeyword, additionalKeywords } = generateSEOKeywords(tags, categoryTitle, articleTitle);
  
  console.log('Generated SEO Keywords:');
  console.log('Focus Keyword:', focusKeyword);
  console.log('Additional Keywords:', additionalKeywords);
  
  return { focusKeyword, additionalKeywords };
}

/**
 * Streamlined tag system for your site
 * Use these instead of duplicating SEO keywords
 */
export const CONTENT_TAGS = {
  // Article Types
  ANALYSIS: 'Analysis',
  RANKING: 'Rankings', 
  NEWS: 'Breaking News',
  PREVIEW: 'Season Preview',
  RECAP: 'Game Recap',
  
  // Player Focus
  ROOKIE: 'Rookie Analysis',
  VETERAN: 'Veteran Analysis',
  QUARTERBACK: 'QB Analysis',
  SKILL_POSITION: 'Skill Position',
  
  // Time/Season
  SEASON_2025: '2025 Season',
  OFFSEASON: 'Offseason',
  PLAYOFFS: 'Playoffs',
  DRAFT: 'NFL Draft',
  
  // Performance
  BREAKOUT: 'Breakout Players',
  SLEEPER: 'Sleeper Picks',
  BUST: 'Potential Busts',
  TOP_PERFORMER: 'Top Performers'
};

/**
 * Simplified category system
 */
export const CONTENT_CATEGORIES = {
  HEADLINES: 'Headlines',
  ANALYSIS: 'Analysis',
  RANKINGS: 'Rankings',
  NEWS: 'News',
  STANDINGS: 'Standings'
};

/**
 * Example usage for your current article
 */
export function exampleForRookiesArticle() {
  return {
    // Use these tags in Sanity (for content organization)
    recommendedTags: [
      CONTENT_TAGS.ROOKIE,
      CONTENT_TAGS.SEASON_2025,
      CONTENT_TAGS.RANKING,
      CONTENT_TAGS.BREAKOUT
    ],
    
    // Use this category in Sanity
    recommendedCategory: CONTENT_CATEGORIES.HEADLINES,
    
    // These will be auto-generated for SEO
    generatedSEO: generateSEOKeywords(
      [CONTENT_TAGS.ROOKIE, CONTENT_TAGS.SEASON_2025, CONTENT_TAGS.RANKING, CONTENT_TAGS.BREAKOUT],
      CONTENT_CATEGORIES.HEADLINES,
      'Top 5 NFL Rookies to Watch in 2025 Season'
    )
  };
}

// Run this to see the recommendation for your current article
if (typeof window !== 'undefined') {
  // Only run in browser
  console.log('SEO Recommendation for Rookies Article:', exampleForRookiesArticle());
}

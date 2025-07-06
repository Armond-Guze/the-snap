// Auto-generate SEO keywords from Sanity tags and categories
// This utility helps reduce duplication between content tags and SEO keywords

export interface SEOKeywordGenerator {
  focusKeyword: string;
  additionalKeywords: string[];
}

/**
 * Generates SEO-optimized keywords from article tags and category
 * @param tags - Array of content tags from Sanity
 * @param categoryTitle - Category title from Sanity
 * @param articleTitle - Article title for context
 * @returns Object with focusKeyword and additionalKeywords
 */
export function generateSEOKeywords(
  tags: string[] = [],
  categoryTitle: string = '',
  articleTitle: string = ''
): SEOKeywordGenerator {
  // Extract year from title (e.g., "2025")
  const yearMatch = articleTitle.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  // Process tags to create SEO-friendly keywords
  const processedTags = tags.map(tag => {
    // Convert to lowercase and clean up
    let processed = tag.toLowerCase().trim();
    
    // Add NFL context if not present
    if (!processed.includes('nfl') && isNFLRelated(processed)) {
      processed = `nfl ${processed}`;
    }
    
    // Add year if it's a seasonal topic
    if (isSeasonalTopic(processed) && !processed.includes(year)) {
      processed = `${processed} ${year}`;
    }
    
    return processed;
  });
  
  // Process category to create additional keywords
  const processedCategory = categoryTitle.toLowerCase().trim();
  const categoryKeywords = [];
  
  if (processedCategory) {
    categoryKeywords.push(processedCategory);
    
    // Add variations based on category
    if (processedCategory.includes('headline')) {
      categoryKeywords.push('nfl news', 'football news', `nfl ${year}`);
    }
    if (processedCategory.includes('rankings')) {
      categoryKeywords.push('nfl rankings', 'football rankings', `${year} nfl rankings`);
    }
    if (processedCategory.includes('analysis')) {
      categoryKeywords.push('nfl analysis', 'football analysis', 'expert analysis');
    }
  }
  
  // Generate focus keyword (most important/specific)
  const focusKeyword = generateFocusKeyword(processedTags, articleTitle, year);
  
  // Combine and deduplicate additional keywords
  const allKeywords = [...processedTags, ...categoryKeywords];
  const additionalKeywords = [...new Set(allKeywords)]
    .filter(keyword => keyword !== focusKeyword)
    .slice(0, 6); // Limit to 6 additional keywords
  
  return {
    focusKeyword,
    additionalKeywords
  };
}

/**
 * Generates the primary focus keyword based on article content
 */
function generateFocusKeyword(tags: string[], title: string, year: string): string {
  const titleLower = title.toLowerCase();
  
  // Extract key phrases from title based on topic
  if (titleLower.includes('rookie')) {
    return `nfl rookies ${year}`;
  }
  if (titleLower.includes('power ranking') || (titleLower.includes('ranking') && titleLower.includes('week'))) {
    return `nfl power rankings ${year}`;
  }
  if (titleLower.includes('ranking') || titleLower.includes('top')) {
    return `nfl rankings ${year}`;
  }
  if (titleLower.includes('playoff')) {
    return `nfl playoffs ${year}`;
  }
  if (titleLower.includes('draft')) {
    return `nfl draft ${year}`;
  }
  if (titleLower.includes('trade') || titleLower.includes('breaking')) {
    return `nfl trade news ${year}`;
  }
  if (titleLower.includes('prediction')) {
    return `nfl predictions ${year}`;
  }
  if (titleLower.includes('injury')) {
    return `nfl injury news ${year}`;
  }
  if (titleLower.includes('free agent')) {
    return `nfl free agency ${year}`;
  }
  if (titleLower.includes('contract')) {
    return `nfl contracts ${year}`;
  }
  if (titleLower.includes('coach')) {
    return `nfl coaching news ${year}`;
  }
  if (titleLower.includes('schedule')) {
    return `nfl schedule ${year}`;
  }
  if (titleLower.includes('season')) {
    return `nfl ${year} season`;
  }
  
  // Check for team names in title
  const teamNames = ['cowboys', 'chiefs', 'bills', 'patriots', 'packers', 'steelers', 'eagles', 'giants', 'ravens', 'bengals'];
  const foundTeam = teamNames.find(team => titleLower.includes(team));
  if (foundTeam) {
    return `${foundTeam} news ${year}`;
  }
  
  // Fall back to most relevant tag + NFL + year
  const bestTag = tags.find(tag => 
    tag.toLowerCase().includes('nfl') || 
    tag.toLowerCase().includes('football') || 
    tag.toLowerCase().includes('player') || 
    tag.toLowerCase().includes('team')
  );
  
  return bestTag ? `nfl ${bestTag.toLowerCase()} ${year}` : `nfl ${year}`;
}

/**
 * Checks if a term is NFL-related
 */
function isNFLRelated(term: string): boolean {
  const nflTerms = [
    'rookie', 'draft', 'playoff', 'season', 'quarterback', 'running back',
    'wide receiver', 'defense', 'offense', 'touchdown', 'field goal',
    'super bowl', 'football', 'player', 'team', 'coach', 'stats'
  ];
  
  return nflTerms.some(nflTerm => term.includes(nflTerm));
}

/**
 * Checks if a topic is seasonal (should include year)
 */
function isSeasonalTopic(term: string): boolean {
  const seasonalTerms = ['season', 'draft', 'playoff', 'rookie', 'rankings'];
  return seasonalTerms.some(seasonal => term.includes(seasonal));
}

/**
 * Hook to automatically populate SEO fields in Sanity Studio
 * Call this when tags or category changes
 */
export function useAutoSEOKeywords() {
  return {
    generateKeywords: generateSEOKeywords,
    
    // Helper to format for Sanity Studio
    formatForSanity: (tags: string[], categoryTitle: string, articleTitle: string) => {
      const { focusKeyword, additionalKeywords } = generateSEOKeywords(tags, categoryTitle, articleTitle);
      
      return {
        focusKeyword,
        additionalKeywords
      };
    }
  };
}

/**
 * Example: Test the generator with different article types
 */
export function testDifferentArticles() {
  const examples = [
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
    }
  ];

  console.log("SEO Keywords for Different Article Types:");
  console.log("=" .repeat(50));
  
  examples.forEach((example, index) => {
    const result = generateSEOKeywords(example.tags, example.category, example.title);
    console.log(`\n${index + 1}. ${example.title}`);
    console.log(`Focus: ${result.focusKeyword}`);
    console.log(`Additional: ${result.additionalKeywords.join(", ")}`);
  });
  
  return examples.map(example => ({
    ...example,
    seo: generateSEOKeywords(example.tags, example.category, example.title)
  }));
}

// Export common keyword combinations for your site
export const COMMON_NFL_KEYWORDS = {
  rookies: ['nfl rookies', 'best nfl rookies', 'rookie watch list', 'nfl draft picks', 'breakout rookies'],
  rankings: ['nfl rankings', 'power rankings', 'team rankings', 'player rankings', 'nfl standings'],
  analysis: ['nfl analysis', 'expert analysis', 'game analysis', 'player analysis', 'team analysis'],
  news: ['nfl news', 'football news', 'breaking news', 'latest news', 'nfl updates'],
  season: ['nfl season', 'football season', 'regular season', 'playoff season', 'season preview']
};

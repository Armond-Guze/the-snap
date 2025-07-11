// Automatic SEO generator for Headlines and Rankings
// This will auto-fill most SEO fields so you don't have to do it manually

interface AutoSEOInput {
  title: string;
  summary?: string;
  tags?: Array<{ title: string }>;
  category?: { title: string };
  contentType: 'headline' | 'rankings';
  rankingType?: string;
}

interface GeneratedSEO {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  additionalKeywords: string[];
  ogTitle: string;
  ogDescription: string;
}

/**
 * Auto-generates SEO data for articles and rankings
 */
export function generateAutoSEO(input: AutoSEOInput): GeneratedSEO {
  const { title, summary, tags = [], category, contentType, rankingType } = input;
  
  // Generate meta title (keep under 60 characters)
  let metaTitle = title;
  if (metaTitle.length > 60) {
    metaTitle = title.substring(0, 57) + '...';
  }
  
  // Add site branding if there's room
  if (metaTitle.length <= 45) {
    metaTitle += ' | The Snap';
  }
  
  // Generate meta description (keep under 160 characters)
  let metaDescription = summary || '';
  
  if (!metaDescription) {
    // Auto-generate description based on content type
    if (contentType === 'rankings') {
      const type = rankingType ? rankingType.replace('-', ' ') : 'team';
      metaDescription = `Latest ${type} rankings and analysis. See where your team stands in our comprehensive NFL rankings.`;
    } else {
      metaDescription = `Latest NFL news and analysis. Stay updated with breaking news, player updates, and in-depth coverage.`;
    }
  }
  
  if (metaDescription.length > 160) {
    metaDescription = metaDescription.substring(0, 157) + '...';
  }
  
  // Generate focus keyword
  const focusKeyword = generateFocusKeyword(title, contentType, rankingType);
  
  // Generate additional keywords
  const additionalKeywords = generateAdditionalKeywords(
    title, 
    tags.map(tag => tag.title), 
    category?.title,
    contentType,
    rankingType
  );
  
  return {
    metaTitle,
    metaDescription,
    focusKeyword,
    additionalKeywords,
    ogTitle: title, // Use original title for social media
    ogDescription: metaDescription
  };
}

/**
 * Generate the main focus keyword
 */
function generateFocusKeyword(title: string, contentType: string, rankingType?: string): string {
  const titleLower = title.toLowerCase();
  
  if (contentType === 'rankings') {
    if (rankingType) {
      return `NFL ${rankingType.replace('-', ' ')} rankings`;
    }
    return 'NFL rankings';
  }
  
  // For headlines, extract key phrases
  const nflTerms = ['quarterback', 'running back', 'wide receiver', 'defense', 'playoff', 'trade', 'draft'];
  const foundTerm = nflTerms.find(term => titleLower.includes(term));
  
  if (foundTerm) {
    return `NFL ${foundTerm}`;
  }
  
  // Default to NFL news
  return 'NFL news';
}

/**
 * Generate additional supporting keywords
 */
function generateAdditionalKeywords(
  title: string, 
  tags: string[], 
  category?: string,
  contentType?: string,
  rankingType?: string
): string[] {
  const keywords: string[] = [];
  const titleLower = title.toLowerCase();
  
  // Add year if mentioned
  const currentYear = new Date().getFullYear();
  if (titleLower.includes(currentYear.toString())) {
    keywords.push(`NFL ${currentYear}`);
  }
  
  // Add content-type specific keywords
  if (contentType === 'rankings') {
    keywords.push('NFL power rankings', 'team rankings', 'football rankings');
    if (rankingType) {
      keywords.push(`${rankingType.replace('-', ' ')} rankings`);
    }
  } else {
    keywords.push('NFL news', 'football news', 'NFL updates');
  }
  
  // Add team names if found in title
  const teams = [
    'Chiefs', 'Bills', 'Bengals', 'Ravens', 'Steelers', 'Browns', 'Titans', 'Colts', 'Texans', 'Jaguars',
    'Broncos', 'Raiders', 'Chargers', 'Cowboys', 'Eagles', 'Giants', 'Commanders', 'Packers', 'Bears',
    'Lions', 'Vikings', 'Saints', 'Falcons', 'Panthers', 'Buccaneers', '49ers', 'Seahawks', 'Rams',
    'Cardinals', 'Jets', 'Dolphins', 'Patriots'
  ];
  
  teams.forEach(team => {
    if (titleLower.includes(team.toLowerCase())) {
      keywords.push(`${team} NFL`);
    }
  });
  
  // Add processed tags
  tags.forEach(tag => {
    if (tag && tag.length > 2) {
      keywords.push(tag.toLowerCase());
    }
  });
  
  // Add category
  if (category && category !== 'Headlines') {
    keywords.push(category.toLowerCase());
  }
  
  // Remove duplicates and return max 8 keywords
  return [...new Set(keywords)].slice(0, 8);
}

/**
 * Helper function for use in Sanity Studio
 * Call this in your document actions or webhooks
 */
export function generateSEOForDocument(document: Record<string, unknown>): GeneratedSEO | null {
  if (!document.title || typeof document.title !== 'string') return null;
  
  return generateAutoSEO({
    title: document.title,
    summary: typeof document.summary === 'string' ? document.summary : undefined,
    tags: Array.isArray(document.tags) ? document.tags : [],
    category: document.category as { title: string } | undefined,
    contentType: document._type === 'rankings' ? 'rankings' : 'headline',
    rankingType: typeof document.rankingType === 'string' ? document.rankingType : undefined
  });
}

// Export for easy testing
export const EXAMPLE_GENERATIONS = {
  headline: generateAutoSEO({
    title: "Top 5 NFL Rookies to Watch in 2025 Season",
    summary: "These rookie players are set to make a huge impact in their first NFL season.",
    tags: [{ title: "Rookies" }, { title: "2025 Season" }],
    contentType: 'headline'
  }),
  
  rankings: generateAutoSEO({
    title: "NFL Power Rankings Week 10: Chiefs Still Dominate",
    summary: "Kansas City maintains the top spot while playoff races heat up.",
    tags: [{ title: "Week 10" }, { title: "Power Rankings" }],
    contentType: 'rankings',
    rankingType: 'power-rankings'
  })
};

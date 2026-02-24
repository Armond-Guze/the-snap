/**
 * Content normalization utilities
 * Provides consistent interfaces for both legacy and unified content types
 */

import { 
  UnifiedContent, 
  LegacyHeadline, 
  LegacyRanking, 
  NormalizedContent,
  ContentType 
} from '@/types/content';

/**
 * Normalizes any content type into a consistent format
 */
export function normalizeContent(content: UnifiedContent | LegacyHeadline | LegacyRanking | any): NormalizedContent {
  // Handle unified content (new system)
  if ('contentType' in content) {
    const base = {
      _id: content._id,
      _type: content._type,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt || '',
      publishedAt: content.publishedAt,
      featuredImage: content.featuredImage,
      author: content.author,
      contentType: content.contentType,
      seo: content.seo,
    };

    // Article-specific fields
    if (content.contentType === 'article') {
      return {
        ...base,
        content: (content as any).content,
        category: (content as any).category,
        tags: (content as any).tags,
        readingTime: (content as any).readingTime,
        viewCount: (content as any).viewCount,
      };
    }
    
    // Rankings-specific fields
    if (content.contentType === 'ranking') {
      return {
        ...base,
        week: (content as any).week,
        season: (content as any).season,
        teams: (content as any).teams,
      };
    }

    return base;
  }
  
  // Handle legacy headlines
  if (content._type === 'headline') {
    return {
      _id: content._id,
      _type: content._type,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt || content.summary || '',
      publishedAt: content.publishedAt || content.date,
      featuredImage: content.featuredImage || content.coverImage,
      author: content.author,
      contentType: 'article' as ContentType,
      content: content.content,
      category: content.category,
      tags: content.tags,
      readingTime: content.readingTime,
      viewCount: content.viewCount,
      seo: content.seo,
    };
  }
  
  // Handle legacy rankings (both powerRanking and rankings types)
  if (content._type === 'powerRanking' || content._type === 'rankings') {
    return {
      _id: content._id,
      _type: content._type,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt || content.summary || '',
      publishedAt: content.publishedAt || content.date,
      featuredImage: content.featuredImage || content.coverImage,
      author: content.author,
      contentType: 'ranking' as ContentType,
      week: content.week,
      season: content.season,
      teams: content.teams,
      articleImage: content.articleImage,
      seo: content.seo,
    };
  }
  
  throw new Error(`Unknown content type: ${content._type}`);
}

/**
 * Gets the appropriate URL for any content type
 */
export function getContentUrl(content: NormalizedContent): string {
  const slugValue = typeof content.slug === 'string' ? content.slug : content.slug?.current;
  if (content.contentType === 'ranking') {
    return `/articles/${slugValue}`;
  }
  return `/articles/${slugValue}`;
}

/**
 * Gets the appropriate badge color for content type
 */
export function getContentBadgeColor(content: NormalizedContent): string {
  if (content.contentType === 'ranking') {
    return 'bg-yellow-500 text-black';
  }
  
  if (content.category) {
    // Map category to colors (you can expand this)
    const categoryColors: Record<string, string> = {
      'breaking-news': 'bg-red-500 text-white',
      'analysis': 'bg-blue-500 text-white',
      'rumors': 'bg-purple-500 text-white',
      'injury-report': 'bg-orange-500 text-white',
      'draft': 'bg-green-500 text-white',
    };
    
    const categorySlug = typeof content.category === 'object' ? content.category.slug?.current : content.category;
    return categoryColors[categorySlug] || 'bg-gray-500 text-white';
  }
  
  return 'bg-gray-500 text-white';
}

/**
 * Gets the display text for content badge
 */
export function getContentBadgeText(content: NormalizedContent): string {
  if (content.contentType === 'ranking') {
    return `Week ${content.week} Rankings`;
  }
  
  if (content.category) {
    const categoryTitle = typeof content.category === 'object' ? content.category.title : content.category;
    return categoryTitle;
  }
  
  return 'Article';
}

/**
 * Checks if content is a ranking type
 */
export function isRankingContent(content: NormalizedContent): boolean {
  return content.contentType === 'ranking';
}

/**
 * Checks if content is an article type
 */
export function isArticleContent(content: NormalizedContent): boolean {
  return content.contentType === 'article';
}

/**
 * Sorts content by publish date (newest first)
 */
export function sortContentByDate(contents: NormalizedContent[]): NormalizedContent[] {
  return contents.sort((a, b) => {
    const dateA = new Date(a.publishedAt || 0);
    const dateB = new Date(b.publishedAt || 0);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filters content by type
 */
export function filterContentByType(contents: NormalizedContent[], type: ContentType): NormalizedContent[] {
  return contents.filter(content => content.contentType === type);
}

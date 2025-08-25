/**
 * Content types with discriminated unions for type safety
 */

export type ContentType = 'article' | 'ranking';

// Base content interface shared by all content types
export interface BaseContent {
  _id: string;
  _type: string;
  _createdAt?: string;
  _updatedAt?: string;
  title: string;
  slug: {
    current: string;
  } | string;
  excerpt?: string;
  publishedAt: string;
  featuredImage?: {
    asset: {
      _id: string;
      url: string;
      altText?: string;
      metadata?: {
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
  };
  author?: {
    _id: string;
    name: string;
    image?: {
      asset: {
        _id: string;
        url: string;
      };
    };
  role?: string; // editorial role / title
  bio?: string;
  experienceYears?: number;
  twitter?: string;
  website?: string;
  };
  seo?: SEOData;
}

// Portable text content type
export interface PortableTextContent {
  _type: string;
  children?: Array<{
    _type: string;
    text: string;
    marks?: string[];
  }>;
  markDefs?: Array<{
    _key: string;
    _type: string;
    [key: string]: unknown;
  }>;
  style?: string;
  [key: string]: unknown;
}

// SEO data structure
export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
  autoGenerate?: boolean;
  lastGenerated?: string;
}

// Category reference
export interface CategoryReference {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
}

// Tag reference
export interface TagReference {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
}

// Team data for rankings - matches Sanity rankings schema
export interface TeamData {
  rank: number;
  previousRank?: number;
  teamName: string;
  teamLogo?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  teamColor?: string;
  summary?: string;
  analysis?: PortableTextContent[];
  stats?: Array<{
    label: string;
    value: string;
  }>;
}

// Unified content type (new system)
export type UnifiedContent = BaseContent & {
  contentType: ContentType;
} & (
  // Article variant
  | {
      contentType: 'article';
      content: PortableTextContent[]; // Portable text content
      category?: CategoryReference;
      tags?: TagReference[];
      readingTime?: number;
      viewCount?: number;
    }
  // Ranking variant
  | {
      contentType: 'ranking';
      week: number;
      season: number;
      teams: TeamData[];
    }
);

// Legacy headline type (for backward compatibility)
export interface LegacyHeadline extends BaseContent {
  _type: 'headline';
  content: PortableTextContent[]; // Portable text content
  category?: CategoryReference;
  tags?: TagReference[];
  readingTime?: number;
  viewCount?: number;
}

// Legacy ranking type (for backward compatibility)
export interface LegacyRanking extends BaseContent {
  _type: 'powerRanking';
  week: number;
  season: number;
  teams: TeamData[];
}

// Normalized content type (after processing through normalizeContent)
export type NormalizedContent = BaseContent & {
  contentType: ContentType;
  // Optional article fields
  content?: PortableTextContent[];
  category?: CategoryReference | string;
  tags?: TagReference[];
  readingTime?: number;
  viewCount?: number;
  // Optional ranking fields
  week?: number;
  season?: number;
  teams?: TeamData[];
  // Optional article image
  articleImage?: {
    asset: {
      _id: string;
      url: string;
    };
  };
};

// Type guards
export function isUnifiedContent(content: unknown): content is UnifiedContent {
  return content !== null && typeof content === 'object' && 'contentType' in content;
}

export function isLegacyHeadline(content: unknown): content is LegacyHeadline {
  return content !== null && typeof content === 'object' && '_type' in content && content._type === 'headline';
}

export function isLegacyRanking(content: unknown): content is LegacyRanking {
  return content !== null && typeof content === 'object' && '_type' in content && content._type === 'powerRanking';
}

export function isArticleContent(content: NormalizedContent): content is NormalizedContent & { contentType: 'article' } {
  return content.contentType === 'article';
}

export function isRankingContent(content: NormalizedContent): content is NormalizedContent & { contentType: 'ranking' } {
  return content.contentType === 'ranking';
}

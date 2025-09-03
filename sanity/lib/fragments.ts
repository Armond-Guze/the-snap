/**
 * GROQ Fragments for reusable query patterns
 * Centralizes common field selections and projections
 */

// Base content fields shared across all content types
export const baseContentFields = `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  homepageTitle,
  slug,
  excerpt,
  publishedAt,
  featuredImage {
    asset-> {
      _id,
      url,
      altText,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  },
  author-> {
    _id,
    name,
    image {
      asset-> {
        _id,
        url
      }
    }
  }
`;

// SEO fields fragment
export const seoFields = `
  seo {
    metaTitle,
    metaDescription,
    keywords,
    ogTitle,
    ogDescription,
    ogImage {
      asset-> {
        _id,
        url
      }
    },
    twitterTitle,
    twitterDescription,
    twitterImage {
      asset-> {
        _id,
        url
      }
    },
    canonicalUrl,
    noIndex,
    structuredData
  }
`;

// Article specific fields
export const articleFields = `
  ${baseContentFields},
  content,
  category-> {
    _id,
    title,
    slug
  },
  tags[]-> {
    _id,
    title,
    slug
  },
  readingTime,
  viewCount,
  ${seoFields}
`;

// Rankings specific fields
export const rankingFields = `
  ${baseContentFields},
  week,
  season,
  articleImage {
    asset-> {
      _id,
      url
    }
  },
  body,
  teams[] {
    rank,
    previousRank,
    teamName,
    teamLogo {
      asset-> {
        _id,
        url
      }
    },
    teamColor,
    summary,
    analysis,
    stats[] {
      label,
      value
    }
  },
  methodology,
  rankingType,
  youtubeVideoId,
  videoTitle,
  twitterUrl,
  twitterTitle,
  instagramUrl,
  instagramTitle,
  tiktokUrl,
  tiktokTitle,
  ${seoFields}
`;

// Unified content fields (includes both article and ranking specific fields)
export const unifiedContentFields = `
  ${baseContentFields},
  contentType,
  
  // Article fields (conditional)
  content,
  category-> {
    _id,
    title,
    slug
  },
  tags[]-> {
    _id,
    title,
    slug
  },
  readingTime,
  viewCount,
  
  // Rankings fields (conditional)
  week,
  season,
  teams[] {
    rank,
    previousRank,
    teamName,
    teamLogo {
      asset-> {
        _id,
        url
      }
    },
    teamColor,
    summary,
    analysis,
    stats[] {
      label,
      value
    }
  },
  methodology,
  rankingType,
  youtubeVideoId,
  videoTitle,
  twitterUrl,
  twitterTitle,
  instagramUrl,
  instagramTitle,
  tiktokUrl,
  tiktokTitle,
  
  ${seoFields}
`;

// Common filters
export const publishedFilter = `publishedAt != null && publishedAt <= now()`;
export const draftFilter = `publishedAt == null || publishedAt > now()`;

// Sorting patterns
export const sortByPublishedDesc = `order(publishedAt desc)`;
export const sortByCreatedDesc = `order(_createdAt desc)`;
export const sortByWeekDesc = `order(week desc)`;

// Related content projection
export const relatedContentProjection = `{
  ${baseContentFields},
  contentType,
  category-> {
    _id,
    title,
    slug
  }
}`;

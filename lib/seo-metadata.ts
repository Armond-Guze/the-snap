// Runtime SEO generator for your Next.js pages
// This generates the final SEO metadata that gets used in your HTML

import type { Metadata } from 'next';
import { generateAutoSEO } from './auto-seo-generator';
import type { HeadlineListItem } from '@/types';

interface SEOInput {
  title: string;
  summary?: string;
  coverImage?: {
    asset?: {
      url: string;
    };
  };
  tags?: Array<{ title: string }>;
  category?: { title: string };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: {
      asset?: {
        url: string;
      };
    };
    advanced?: {
      noIndex?: boolean;
      canonicalUrl?: string;
    };
  };
  _type?: string;
  rankingType?: string;
}

/**
 * Generates Next.js Metadata object for pages
 * Combines manual SEO settings with auto-generated fallbacks
 */
export function generatePageMetadata(
  content: SEOInput,
  pageUrl: string,
  siteName = 'The Snap'
): Metadata {
  // Generate auto SEO as fallback
  const autoSEO = generateAutoSEO({
    title: content.title,
    summary: content.summary,
    tags: content.tags || [],
    category: content.category,
    contentType: content._type === 'rankings' ? 'rankings' : 'headline',
    rankingType: content.rankingType
  });

  // Use manual overrides or auto-generated fallbacks
  const metaTitle = content.seo?.metaTitle || autoSEO.metaTitle;
  const metaDescription = content.seo?.metaDescription || autoSEO.metaDescription;
  
  // Choose the best image: manual OG image > cover image > default
  const ogImageUrl = 
    content.seo?.ogImage?.asset?.url ||
    content.coverImage?.asset?.url ||
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thesnap.com'}/images/default-og.jpg`;

  // Build metadata object
  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    
    // Open Graph (Facebook, LinkedIn)
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: pageUrl,
      siteName,
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: content.title,
      }],
      type: 'article',
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
    },
    
    // Canonical URL
    alternates: {
      canonical: content.seo?.advanced?.canonicalUrl || pageUrl,
    },
    
    // Keywords for search engines
    keywords: [autoSEO.focusKeyword, ...autoSEO.additionalKeywords],
  };

  // Add noindex if specified
  if (content.seo?.advanced?.noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

/**
 * Simplified function for headlines
 */
export function generateHeadlineMetadata(
  headline: HeadlineListItem,
  baseUrl: string
): Metadata {
  const pageUrl = headline._type === 'rankings' 
    ? `${baseUrl}/rankings/${headline.slug.current}`
    : `${baseUrl}/headlines/${headline.slug.current}`;

  return generatePageMetadata(headline as SEOInput, pageUrl);
}

/**
 * Generate metadata for homepage
 */
export function generateHomepageMetadata(baseUrl: string): Metadata {
  return {
    title: 'The Snap - NFL News, Rankings & Analysis',
    description: 'Your ultimate source for NFL news, power rankings, player analysis, and in-depth football coverage. Stay updated with the latest from around the league.',
    
    openGraph: {
      title: 'The Snap - NFL News & Analysis',
      description: 'Your ultimate source for NFL news, rankings, and analysis.',
      url: baseUrl,
      siteName: 'The Snap',
      images: [{
        url: `${baseUrl}/images/og-homepage.jpg`,
        width: 1200,
        height: 630,
        alt: 'The Snap - NFL News and Analysis',
      }],
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: 'The Snap - NFL News & Analysis',
      description: 'Your ultimate source for NFL news, rankings, and analysis.',
    },
    
    keywords: [
      'NFL news',
      'NFL rankings',
      'NFL power rankings',
      'football news',
      'NFL analysis',
      'NFL updates',
      'NFL playoffs',
      'NFL draft'
    ],
  };
}

/**
 * Default metadata for categories/sections
 */
export function generateCategoryMetadata(
  categoryName: string,
  categoryDescription: string,
  baseUrl: string
): Metadata {
  const title = `${categoryName} - The Snap`;
  const description = categoryDescription || `Latest ${categoryName.toLowerCase()} news and analysis from The Snap.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${categoryName.toLowerCase()}`,
      siteName: 'The Snap',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

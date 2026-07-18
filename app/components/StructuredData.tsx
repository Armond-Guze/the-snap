// Simple helper to render JSON-LD structured data
// Usage: <StructuredData data={{ ...jsonLd }} />
// Render directly into the document so crawlers receive the JSON-LD in the
// initial HTML instead of waiting for Next.js' client-side script loader.
import { DEFAULT_OG_IMAGE_URL, SITE_BRAND, SITE_SOCIAL_URLS, SITE_URL } from '@/lib/site-config'

interface StructuredDataProps {
  data: Record<string, unknown>
  id?: string // allow multiple distinct structured data blocks
}

export default function StructuredData({ data, id }: StructuredDataProps) {
  const typeSegment = typeof data['@type'] === 'string' ? (data['@type'] as string).toLowerCase() : 'data';
  // Attempt to read a headline or name field without using any casting
  const possibleHeadline = typeof (data as Record<string, unknown>)['headline'] === 'string'
    ? (data as Record<string, unknown>)['headline'] as string
    : (typeof (data as Record<string, unknown>)['name'] === 'string'
        ? (data as Record<string, unknown>)['name'] as string
        : 'global');
  const headlineSegment = possibleHeadline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const derivedId = id || `sd-${typeSegment}-${headlineSegment}`;

  return (
    <script
      id={derivedId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  )
}

// Helper functions for common structured data
export const createWebsiteStructuredData = (siteName: string, url: string, alternateName?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  ...(alternateName ? { alternateName } : {}),
  url: url,
})

export const createOrganizationStructuredData = (
  name: string,
  url: string,
  logo: string,
  alternateName?: string,
  sameAs: string[] = []
) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: name,
  ...(alternateName ? { alternateName } : {}),
  url: url,
  logo: logo,
  ...(sameAs.length ? { sameAs } : {}),
})

type StructuredAuthor = {
  name: string;
  type?: 'Person' | 'Organization';
  url?: string;
  sameAs?: string[];
};

function normalizeAuthor(author: StructuredAuthor) {
  const organizationByline = /^(the (game )?snap|staff writer|editorial team)$/i.test(author.name.trim());
  const authorType = author.type || (organizationByline ? 'Organization' : 'Person');
  const sameAs = author.sameAs?.length
    ? author.sameAs
    : authorType === 'Organization'
      ? [...SITE_SOCIAL_URLS]
      : [];
  return {
    '@type': authorType,
    name: author.name,
    ...(author.url ? { url: author.url } : authorType === 'Organization' ? { url: SITE_URL } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export const createArticleStructuredData = (
  headline: string,
  description: string,
  url: string,
  imageUrl: string,
  datePublished: string,
  dateModified: string,
  authorName: string
) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: headline,
  description: description,
  url: url,
  image: imageUrl,
  datePublished: datePublished,
  dateModified: dateModified,
  author: normalizeAuthor({ name: authorName }),
  publisher: {
    '@type': 'Organization',
    name: SITE_BRAND,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_OG_IMAGE_URL,
    },
  },
})

// Enhanced news article schema with richer context & SEO features
interface EnhancedArticleParams {
  headline: string;
  description: string;
  canonicalUrl: string; // absolute
  images: { url: string; width?: number; height?: number }[]; // largest first
  datePublished: string;
  dateModified: string;
  author: StructuredAuthor;
  articleSection?: string; // category
  keywords?: string[];
  speakableSelectors?: string[]; // CSS selectors for Speakable spec
}

export const createEnhancedArticleStructuredData = (p: EnhancedArticleParams) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: p.headline,
  ...(p.description?.trim()
    ? { description: p.description.trim() }
    : {}),
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': p.canonicalUrl,
  },
  url: p.canonicalUrl,
  ...(Array.isArray(p.images) && p.images.map(i => i?.url).filter(Boolean).length
    ? { image: p.images.map(i => i.url).filter(Boolean) }
    : {}),
  ...(p.datePublished?.trim() ? { datePublished: p.datePublished.trim() } : {}),
  ...(p.dateModified?.trim() ? { dateModified: p.dateModified.trim() } : {}),
  author: normalizeAuthor(p.author),
  publisher: {
    '@type': 'Organization',
    name: SITE_BRAND,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_OG_IMAGE_URL,
    },
  },
  ...(p.articleSection?.trim() ? { articleSection: p.articleSection.trim() } : {}),
  ...(p.keywords?.length ? { keywords: p.keywords.filter(Boolean) } : {}),
  speakable: p.speakableSelectors?.length
    ? {
        '@type': 'SpeakableSpecification',
        cssSelector: p.speakableSelectors,
      }
    : undefined,
});

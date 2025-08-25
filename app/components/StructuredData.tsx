import Script from 'next/script'

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
    <Script
      id={derivedId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Helper functions for common structured data
export const createWebsiteStructuredData = (siteName: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${url}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})

export const createOrganizationStructuredData = (name: string, url: string, logo: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: name,
  url: url,
  logo: logo,
  sameAs: [
    // Add your social media URLs here
    // 'https://twitter.com/thegamesnap',
  ],
})

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
  author: {
    '@type': 'Person',
    name: authorName,
  },
  publisher: {
    '@type': 'Organization',
    name: 'The Snap',
    logo: {
      '@type': 'ImageObject',
  url: `${url}/images/logo--design copy.png`,
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
  author: { name: string; sameAs?: string[] };
  articleSection?: string; // category
  keywords?: string[];
  speakableSelectors?: string[]; // CSS selectors for Speakable spec
}

export const createEnhancedArticleStructuredData = (p: EnhancedArticleParams) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: p.headline,
  description: p.description,
  mainEntityOfPage: p.canonicalUrl,
  url: p.canonicalUrl,
  image: p.images.map(i => i.url),
  datePublished: p.datePublished,
  dateModified: p.dateModified || p.datePublished,
  author: {
    '@type': 'Person',
    name: p.author.name,
    ...(p.author.sameAs?.length ? { sameAs: p.author.sameAs } : {}),
  },
  publisher: {
    '@type': 'Organization',
    name: 'The Snap',
    logo: {
      '@type': 'ImageObject',
      url: `${new URL('/images/logo--design copy.png', p.canonicalUrl)}`,
    },
  },
  articleSection: p.articleSection,
  keywords: p.keywords,
  speakable: p.speakableSelectors?.length
    ? {
        '@type': 'SpeakableSpecification',
        cssSelector: p.speakableSelectors,
      }
    : undefined,
});

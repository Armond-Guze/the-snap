import Script from 'next/script'

interface StructuredDataProps {
  data: Record<string, unknown>
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
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
      url: `${url}/images/the-snaplogo1.png`,
    },
  },
})

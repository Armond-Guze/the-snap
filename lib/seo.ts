import { Metadata } from 'next'
import { SEOData, SanityImageWithUrl } from '@/types'

export interface ContentData {
  title: string
  summary?: string
  slug: {
    current: string
  }
  seo?: SEOData
  coverImage?: SanityImageWithUrl
  author?: {
    name: string
  }
  date?: string
  category?: {
    title: string
    seo?: SEOData
  }
}

export function generateSEOMetadata(
  content: ContentData,
  basePath: string = '',
  baseUrl: string = 'https://thegamesnap.com'
): Metadata {
  const {
    title,
    summary,
    slug,
    seo,
    coverImage,
    author,
    date,
    category,
  } = content

  // Use SEO fields if available, otherwise fall back to content fields
  const metaTitle = seo?.metaTitle || title
  const metaDescription = seo?.metaDescription || summary || `Read the latest NFL news and updates about ${title} on The Snap.`
  const ogTitle = seo?.ogTitle || seo?.metaTitle || title
  const ogDescription = seo?.ogDescription || seo?.metaDescription || summary || metaDescription
  const ogImageUrl = seo?.ogImage?.asset?.url || coverImage?.asset?.url || '/images/logo--design copy.png'
  const canonicalUrl = seo?.canonicalUrl || `${baseUrl}${basePath}/${slug.current}`

  // Build keywords array
  const keywords = [
    seo?.focusKeyword,
    ...(seo?.additionalKeywords || []),
    'NFL news',
    'NFL headlines',
    'NFL updates',
    'The Snap',
    category?.title && `NFL ${category.title}`,
    author?.name && `${author.name} NFL`,
  ].filter(Boolean) as string[]

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.join(', '),
    authors: author?.name ? [{ name: author.name }] : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      type: 'article',
      publishedTime: date,
      authors: author?.name ? [author.name] : undefined,
      section: category?.title,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !seo?.noIndex,
      follow: !seo?.noIndex,
      googleBot: {
        index: !seo?.noIndex,
        follow: !seo?.noIndex,
      },
    },
  }

  return metadata
}

export function generateCategorySEOMetadata(
  category: {
    title: string
    description?: string
    slug: {
      current: string
    }
    seo?: SEOData
  },
  baseUrl: string = 'https://thegamesnap.com'
): Metadata {
  const {
    title,
    description,
    slug,
    seo,
  } = category

  const metaTitle = seo?.metaTitle || `${title} - NFL News & Updates | The Snap`
  const metaDescription = seo?.metaDescription || description || `Get the latest NFL ${title.toLowerCase()} news, updates, and analysis on The Snap.`
  const ogImageUrl = seo?.ogImage?.asset?.url || '/images/logo--design copy.png'
  const canonicalUrl = `${baseUrl}/categories/${slug.current}`

  const keywords = [
    seo?.focusKeyword,
    ...(seo?.additionalKeywords || []),
    `NFL ${title}`,
    `NFL ${title} news`,
    `NFL ${title} updates`,
    'The Snap',
    'NFL news',
  ].filter(Boolean) as string[]

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.join(', '),
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !seo?.noIndex,
      follow: !seo?.noIndex,
      googleBot: {
        index: !seo?.noIndex,
        follow: !seo?.noIndex,
      },
    },
  }

  return metadata
}

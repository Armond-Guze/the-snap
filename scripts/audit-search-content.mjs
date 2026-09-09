#!/usr/bin/env node

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_API_TOKEN

if (!projectId) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const includeBettingDetails = process.argv.includes('--betting-details')
const competingBettingGuideSlugs = [
  'nfl-betting-odds-explained-spreads-moneylines-totals-and-more',
  'how-to-read-nfl-betting-odds-spreads-moneylines-totals-and-more',
]

const contentQuery = `*[
  (_type == "article" && published == true) ||
  _type == "headline" ||
  _type == "fantasyFootball"
] | order(coalesce(date, publishedAt, _createdAt) desc) {
  _id,
  _type,
  title,
  homepageTitle,
  format,
  slug,
  slugHistory,
  published,
  date,
  dateModified,
  publishedAt,
  _createdAt,
  _updatedAt,
  summary,
  "category": category->{title, "slug": slug.current},
  "author": author->{name, "slug": slug.current},
  "tagRefs": tagRefs[]->{title, "slug": slug.current},
  "topicHubs": topicHubs[]->{title, "slug": slug.current},
  editorialBrief,
  seo,
  "bodyLinks": body[].markDefs[]{
    _type,
    href,
    "reference": reference->{_type, "slug": slug.current}
  },
  "bodyChars": coalesce(length(pt::text(body)), 0),
  "bodyBlocks": count(body),
  "coverImagePresent": defined(coverImage.asset)
}`

const docs = await client.fetch(contentQuery)

const inspectLinks = (doc) => {
  let internal = 0
  let external = 0
  for (const link of doc.bodyLinks || []) {
    if (link?._type === 'internalLink' && link.reference?.slug) {
      internal += 1
      continue
    }
    if (link?._type !== 'link' || !link.href) continue
    if (link.href.startsWith('/')) {
      internal += 1
      continue
    }
    try {
      const host = new URL(link.href).hostname.replace(/^www\./, '').toLowerCase()
      if (host === 'thegamesnap.com') internal += 1
      else external += 1
    } catch {
      // Invalid URLs are reported by Studio validation.
    }
  }
  return {internal, external}
}

const docsWithSignals = docs.map((doc) => ({...doc, linkSignals: inspectLinks(doc)}))

const bettingPattern = /(bet|odds|spread|moneyline|total|super-bowl-lxi-odds|win-totals)/i
const betting = docsWithSignals.filter((doc) =>
  bettingPattern.test(`${doc.title || ''} ${doc.slug?.current || ''}`),
)

const bettingDetails = includeBettingDetails
  ? await client.fetch(
      `*[_type == "article" && slug.current in $slugs] | order(date desc) {
        _id,
        title,
        homepageTitle,
        slug,
        slugHistory,
        published,
        date,
        dateModified,
        summary,
        seo,
        "category": category->{_id, title, "slug": slug.current},
        "author": author->{_id, name, "slug": slug.current},
        "tagRefs": tagRefs[]->{_id, title, "slug": slug.current},
        "topicHubs": topicHubs[]->{_id, title, "slug": slug.current},
        "bodyChars": coalesce(length(pt::text(body)), 0),
        "bodyBlocks": count(body),
        "headings": body[_type == "block" && style in ["h2", "h3"]]{
          style,
          "text": pt::text(@)
        },
        "links": body[].markDefs[_type == "link"]{href}
      }`,
      {slugs: competingBettingGuideSlugs},
    )
  : undefined

const typeCounts = docsWithSignals.reduce((counts, doc) => {
  counts[doc._type] = (counts[doc._type] || 0) + 1
  return counts
}, {})

const report = {
  generatedAt: new Date().toISOString(),
  total: docsWithSignals.length,
  byType: typeCounts,
  missing: {
    summary: docsWithSignals.filter((doc) => !doc.summary?.trim()).length,
    author: docsWithSignals.filter((doc) => !doc.author?.name).length,
    coverImage: docsWithSignals.filter((doc) => !doc.coverImagePresent).length,
    category: docsWithSignals.filter((doc) => !doc.category?.title).length,
    canonicalTags: docsWithSignals.filter((doc) => (doc.tagRefs?.length || 0) < 3).length,
    editorialBrief: docsWithSignals.filter((doc) => !doc.editorialBrief?.targetQuery?.trim()).length,
    humanReview: docsWithSignals.filter((doc) => doc.editorialBrief?.humanReviewed !== true).length,
    contextualInternalLinks: docsWithSignals.filter((doc) => doc.linkSignals.internal === 0).length,
    externalSourceLinks: docsWithSignals.filter((doc) => doc.linkSignals.external === 0).length,
    completeSeo: docsWithSignals.filter((doc) =>
      !doc.seo?.metaTitle?.trim() || !doc.seo?.metaDescription?.trim() || !doc.seo?.focusKeyword?.trim(),
    ).length,
    thinUnder1500Chars: docsWithSignals.filter((doc) => doc.bodyChars < 1500).length,
  },
  betting,
  ...(bettingDetails ? {bettingDetails} : {}),
}

console.log(JSON.stringify(report, null, 2))

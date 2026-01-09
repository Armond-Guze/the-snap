#!/usr/bin/env node
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config({ path: '.env.local' })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
  console.error('Missing SANITY creds: need projectId, dataset, and a write-capable token (SANITY_API_WRITE_TOKEN).')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-07-01', token, useCdn: false })

async function main() {
  // Fetch legacy fantasy docs
  const legacy = await client.fetch(`*[_type == "fantasyFootball"]{
    _id,
    title,
    homepageTitle,
    slug,
    summary,
    coverImage,
    author,
    publishedAt,
    published,
    priority,
    fantasyType,
    content,
    youtubeVideoId,
    videoTitle,
    twitterUrl,
    twitterTitle,
    instagramUrl,
    instagramTitle,
    tiktokUrl,
    tiktokTitle,
    category,
    tags,
    tagRefs,
    seo,
    _createdAt
  }`)

  if (!legacy.length) {
    console.log('No fantasyFootball docs found. Nothing to migrate.')
    return
  }

  // Find existing article-format fantasy docs by slug to avoid duplicates
  const existing = await client.fetch(`*[_type == "article" && format == "fantasy"]{ _id, "slug": slug.current }`)
  const existingSlugs = new Set(existing.map((d) => d.slug))

  const toCreate = legacy.filter((doc) => {
    const slug = doc.slug?.current
    return slug && !existingSlugs.has(slug)
  })

  if (!toCreate.length) {
    console.log('All fantasyFootball docs already have article-format counterparts. Nothing to create.')
    return
  }

  console.log(`Migrating ${toCreate.length} fantasyFootball docs to article format...`)

  const mutations = toCreate.map((doc) => {
    const slug = doc.slug?.current
    const date = doc.publishedAt || doc._createdAt
    return {
      _type: 'article',
      title: doc.title,
      homepageTitle: doc.homepageTitle,
      slug: doc.slug,
      summary: doc.summary,
      coverImage: doc.coverImage,
      author: doc.author,
      date,
      published: doc.published ?? false,
      format: 'fantasy',
      priority: doc.priority,
      category: doc.category,
      tags: doc.tags,
      tagRefs: doc.tagRefs,
      body: doc.content,
      youtubeVideoId: doc.youtubeVideoId,
      videoTitle: doc.videoTitle,
      twitterUrl: doc.twitterUrl,
      twitterTitle: doc.twitterTitle,
      instagramUrl: doc.instagramUrl,
      instagramTitle: doc.instagramTitle,
      tiktokUrl: doc.tiktokUrl,
      tiktokTitle: doc.tiktokTitle,
      seo: doc.seo,
      // preserve slug uniqueness; let Sanity assign _id
    }
  })

  // Create sequentially for clearer logs and fewer conflicts
  for (const doc of mutations) {
    const slug = doc.slug?.current
    try {
      const res = await client.create(doc)
      console.log(`Created article(fantasy): ${slug} -> ${res._id}`)
    } catch (err) {
      console.error(`Failed to create for slug ${slug}:`, err?.response?.body || err)
    }
  }

  console.log('Migration complete. Check the Fantasy Articles list in Studio.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

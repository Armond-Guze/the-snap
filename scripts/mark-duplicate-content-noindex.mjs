#!/usr/bin/env node
// Suppress same-slug duplicate public content.
//
// The canonical article remains published. Duplicate docs are kept in Sanity
// but unpublished and marked noindex with a canonical URL.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/mark-duplicate-content-noindex.mjs
//   node scripts/mark-duplicate-content-noindex.mjs --write

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  process.env.SANITY_DATASET ||
  'production'
const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_STUDIO_API_VERSION ||
  '2024-06-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://thegamesnap.com').replace(/\/+$/, '')

const WRITE = process.argv.includes('--write') || process.argv.includes('--apply')
const DRY_RUN = !WRITE || !token
const CONTENT_TYPES = ['article', 'headline', 'rankings', 'fantasyFootball']

if (!projectId || !dataset) {
  console.error('Missing Sanity projectId/dataset in env')
  process.exit(1)
}

if (WRITE && !token) {
  console.error('Missing Sanity write token. Set SANITY_WRITE_TOKEN or run without --write.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function blockText(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .flatMap((block) => block?.children || [])
    .map((child) => child?.text || '')
    .join(' ')
}

function timestamp(value) {
  const time = new Date(value || 0).getTime()
  return Number.isFinite(time) ? time : 0
}

function canonicalUrl(slug) {
  return `${siteUrl}/articles/${encodeURIComponent(slug)}`
}

function pickCanonicalArticle(group) {
  const articles = group.filter((doc) => doc._type === 'article')
  if (!articles.length) return null

  return [...articles].sort((a, b) => {
    const aNoIndex = a.seo?.noIndex === true ? 1 : 0
    const bNoIndex = b.seo?.noIndex === true ? 1 : 0
    if (aNoIndex !== bNoIndex) return aNoIndex - bNoIndex

    const aTextLength = compact(`${blockText(a.body)} ${blockText(a.content)}`).length
    const bTextLength = compact(`${blockText(b.body)} ${blockText(b.content)}`).length
    if (aTextLength !== bTextLength) return bTextLength - aTextLength

    const updatedDiff = timestamp(b._updatedAt) - timestamp(a._updatedAt)
    if (updatedDiff !== 0) return updatedDiff

    return timestamp(b._createdAt) - timestamp(a._createdAt)
  })[0]
}

function needsPatch(doc, targetCanonicalUrl) {
  return doc.seo?.noIndex !== true || doc.seo?.canonicalUrl !== targetCanonicalUrl
}

function buildPatch(doc, targetCanonicalUrl) {
  return {
    published: false,
    seo: {
      ...(doc.seo || {}),
      _type: 'seo',
      autoGenerate: doc.seo?.autoGenerate ?? true,
      noIndex: true,
      canonicalUrl: targetCanonicalUrl,
      lastGenerated: new Date().toISOString(),
    },
  }
}

function reasonFor(doc) {
  if (doc._type === 'article') return 'same-slug duplicate article'
  return `legacy ${doc._type} twin`
}

async function fetchDocs() {
  return client.fetch(
    `*[
      _type in $types &&
      defined(slug.current) &&
      published == true &&
      !(_id in path("drafts.**"))
    ]{
      _id,
      _type,
      format,
      title,
      "slug": slug.current,
      _createdAt,
      _updatedAt,
      seo,
      body[]{_type,style,children[]{text}},
      content[]{_type,style,children[]{text}}
    }`,
    { types: CONTENT_TYPES }
  )
}

async function main() {
  console.log(`Starting duplicate noindex pass (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)
  const docs = await fetchDocs()
  const bySlug = new Map()

  for (const doc of docs) {
    const slug = compact(doc.slug)
    if (!slug) continue
    const group = bySlug.get(slug) || []
    group.push(doc)
    bySlug.set(slug, group)
  }

  let changed = 0
  let skipped = 0
  let groupsSeen = 0

  for (const [slug, group] of [...bySlug.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (group.length < 2) continue
    const canonical = pickCanonicalArticle(group)
    if (!canonical) continue
    groupsSeen++

    const targetCanonicalUrl = canonicalUrl(slug)
    for (const doc of group) {
      if (doc._id === canonical._id) continue
      if (!needsPatch(doc, targetCanonicalUrl)) {
        skipped++
        continue
      }

      changed++
      console.log(`\n${DRY_RUN ? 'Would suppress' : 'Suppressing'} ${doc._type}${doc.format ? `/${doc.format}` : ''} ${slug}`)
      console.log(`  ${doc.title}`)
      console.log(`  reason: ${reasonFor(doc)}; canonical article: ${canonical._id}`)

      if (!DRY_RUN) {
        await client.patch(doc._id).set(buildPatch(doc, targetCanonicalUrl)).commit({ autoGenerateArrayKeys: true })
      }
    }
  }

  console.log(`\nDone. ${groupsSeen} duplicate slug groups inspected. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} already suppressed.`)
  if (DRY_RUN && token) console.log('Run again with --write to suppress duplicate docs.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

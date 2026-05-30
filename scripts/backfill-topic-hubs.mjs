#!/usr/bin/env node
// Backfill topicHub references from canonical tagRefs and category matches.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-topic-hubs.mjs
//   node scripts/backfill-topic-hubs.mjs --write

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

const WRITE = process.argv.includes('--write') || process.argv.includes('--apply')
const DRY_RUN = !WRITE || !token
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? Number.parseInt(LIMIT_ARG.split('=')[1] || '', 10) : null
const MAX_HUBS = 3
const CONTENT_TYPES = ['article', 'headline', 'rankings', 'fantasyFootball']

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

if (WRITE && !token) {
  console.error('Missing SANITY write token. Set SANITY_WRITE_TOKEN or run without --write.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toRef(id) {
  return { _type: 'reference', _ref: id }
}

function refIds(refs) {
  return Array.isArray(refs) ? refs.map((ref) => ref?._ref).filter(Boolean) : []
}

function textFor(doc, fields = ['title', 'summary']) {
  return fields.map((field) => doc[field] || '').join(' ').toLowerCase()
}

function hasDraftContext(doc) {
  const title = textFor(doc, ['title'])
  return /\bnfl draft\b|\bmock draft\b|\bdraft prospects?\b|\bdraft grades?\b|\bdraft order\b|\bbig board\b|\bround 1\b|\bday 2\b|\bfirst-round\b|\bscouting report\b/.test(title)
}

function hasFreeAgencyContext(doc) {
  const title = textFor(doc, ['title'])
  return /\bfree agenc(y|ies)\b|\bfree agents?\b|\bfranchise tag\b|\bsalary cap\b|\blegal tampering\b/.test(title)
}

function hasBettingContext(doc) {
  const text = textFor(doc)
  return /\bbetting\b|\bodds\b|\bspreads?\b|\bmoneylines?\b|\btotals?\b|\bfutures?\b|\bover\/under\b|\bbest bets?\b/.test(text)
}

function hasTradeContext(doc) {
  const title = textFor(doc, ['title'])
  return /\btrade rumors?\b|\btrade buzz\b|\btrade deadline\b|\btraded\b|\bin trade with\b|\btrade with\b|\btrade for\b|\btrade candidates?\b|\bwill\b[^.?!]{0,80}\btrade\b|\btrade\b[^.?!]{0,80}\?/.test(title)
}

function hasTradeDeadlineContext(doc) {
  const title = textFor(doc, ['title'])
  return /\btrade deadline\b|\bdeadline\b/.test(title)
}

function hubHasContext(hub, doc) {
  const slug = hub?.slug
  const text = textFor(doc)

  if (slug === 'draft') return hasDraftContext(doc)
  if (slug === 'nfl-combine') {
    return /\bcombine\b|\bpro day\b|\bsenior bowl\b|\bathletic testing\b|\bworkout\b|\b40-yard\b/.test(text)
  }
  if (slug === 'nfl-free-agency') return hasFreeAgencyContext(doc) || hasTradeContext(doc)
  if (slug === 'nfl-trade-deadline') return hasTradeDeadlineContext(doc)
  if (slug === 'nfl-betting') return hasBettingContext(doc)
  if (slug === 'nfl-offseason') return hasDraftContext(doc) || hasFreeAgencyContext(doc) || /\boffseason\b|\bowners meetings\b/.test(text)
  if (slug === 'nfl-preseason') return /\bpreseason\b|\btraining camp\b|\broster cuts?\b|\bhall of fame game\b|\bweek 1\b|\brookie report\b/.test(text)
  if (slug === 'nfl-training-camp') return /\btraining camp\b|\bmandatory minicamp\b|\bminicamp\b|\botas\b|\broster cuts?\b|\bhall of fame game\b/.test(text)
  if (slug === 'nfl-regular-season') {
    return /\bregular season\b|\bweek \d+\b|\binjury report\b|\bpower rankings?\b|\bplayoff picture\b|\bstandings\b/.test(text) && !/\boffseason\b/.test(text)
  }

  return true
}

function addCandidate(candidates, hub, score, reason) {
  if (!hub?._id) return
  const existing = candidates.get(hub._id)
  if (!existing || score > existing.score) {
    candidates.set(hub._id, { hub, score, reason })
  }
}

async function fetchHubs() {
  return client.fetch(`*[
    _type == "topicHub" &&
    coalesce(active, true) == true &&
    !(_id in path("drafts.**"))
  ] | order(priority asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    relatedTags[]{ _ref },
    relatedCategories[]->{ "slug": slug.current }
  }`)
}

async function fetchDocs() {
  const docs = await client.fetch(
    `*[
      _type in $types &&
      published == true &&
      !(_id in path("drafts.**"))
    ] | order(coalesce(date, publishedAt, _createdAt) desc) {
      _id,
      _type,
      title,
      format,
      additionalFormats,
      slug,
      summary,
      tagRefs[]{ _ref },
      topicHubs[]{ _ref },
      category->{ "slug": slug.current }
    }`,
    { types: CONTENT_TYPES }
  )
  return Number.isFinite(LIMIT) && LIMIT > 0 ? docs.slice(0, LIMIT) : docs
}

function scoreHubMatches(doc, hubs) {
  const candidates = new Map()
  const tagIds = new Set(refIds(doc.tagRefs))
  const categorySlug = doc.category?.slug
  const titleSummary = `${doc.title || ''} ${doc.summary || ''}`.toLowerCase()
  const isFantasy =
    doc.format === 'fantasy' ||
    (Array.isArray(doc.additionalFormats) && doc.additionalFormats.includes('fantasy')) ||
    doc._type === 'fantasyFootball'

  for (const hub of hubs) {
    if (isFantasy && hub.slug !== 'fantasy-football') continue

    const hubTagIds = new Set(refIds(hub.relatedTags))
    const hubCategorySlugs = new Set(
      (Array.isArray(hub.relatedCategories) ? hub.relatedCategories : [])
        .map((cat) => cat?.slug)
        .filter(Boolean)
    )

    if (categorySlug && hubCategorySlugs.has(categorySlug)) {
      addCandidate(candidates, hub, 95, `category ${categorySlug}`)
    }

    const overlappingTags = Array.from(tagIds).filter((id) => hubTagIds.has(id))
    if (overlappingTags.length > 0 && hubHasContext(hub, doc)) {
      addCandidate(candidates, hub, 90 + overlappingTags.length, `${overlappingTags.length} related tag match(es)`)
    }
  }

  const hubBySlug = new Map(hubs.map((hub) => [hub.slug, hub]))
  if (isFantasy) {
    addCandidate(candidates, hubBySlug.get('fantasy-football'), 100, 'fantasy format')
  }
  if (doc.format === 'powerRankings') {
    addCandidate(candidates, hubBySlug.get('nfl-power-rankings'), 110, 'powerRankings format')
  }
  if (!isFantasy && hasDraftContext(doc)) {
    addCandidate(candidates, hubBySlug.get('draft'), 85, 'draft language')
  }
  if (hasFreeAgencyContext(doc)) {
    addCandidate(candidates, hubBySlug.get('nfl-free-agency'), 85, 'free agency language')
  }
  if (/\bsuper bowl\b/.test(titleSummary)) {
    addCandidate(candidates, hubBySlug.get('super-bowl'), 85, 'super bowl language')
  }
  if (/\bplayoff\b|\bpostseason\b/.test(titleSummary)) {
    addCandidate(candidates, hubBySlug.get('nfl-playoffs'), 80, 'playoff language')
  }

  return Array.from(candidates.values()).sort((a, b) => b.score - a.score || a.hub.title.localeCompare(b.hub.title))
}

async function main() {
  console.log(`Starting topicHubs backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)

  const [hubs, docs] = await Promise.all([fetchHubs(), fetchDocs()])
  console.log(`Loaded ${hubs.length} active topic hubs and ${docs.length} published content docs.`)

  let changed = 0
  let skipped = 0
  let alreadyFull = 0

  for (const doc of docs) {
    const existingIds = refIds(doc.topicHubs)
    const existingSet = new Set(existingIds)
    if (existingIds.length >= MAX_HUBS) {
      alreadyFull++
      continue
    }

    const additions = scoreHubMatches(doc, hubs)
      .filter((candidate) => !existingSet.has(candidate.hub._id))
      .slice(0, Math.max(0, MAX_HUBS - existingIds.length))

    if (!additions.length) {
      skipped++
      continue
    }

    const nextRefs = [...existingIds.map(toRef), ...additions.map((candidate) => toRef(candidate.hub._id))]
    changed++
    const label = `${doc._type}${doc.format ? `/${doc.format}` : ''} ${doc.slug?.current || doc._id}`
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${label}`)
    console.log(`  ${doc.title}`)
    for (const addition of additions) {
      console.log(`  + ${addition.hub.title} (${addition.score}) - ${addition.reason}`)
    }

    if (!DRY_RUN) {
      await client.patch(doc._id).set({ topicHubs: nextRefs }).commit({ autoGenerateArrayKeys: true })
      await sleep(75)
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped, ${alreadyFull} already at ${MAX_HUBS}+ hubs.`)
  if (DRY_RUN && token) {
    console.log('Run again with --write to apply these topicHub additions.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

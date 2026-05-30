#!/usr/bin/env node
// Backfill canonical advancedTag references on published content.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-tag-refs.mjs
//   node scripts/backfill-tag-refs.mjs --write

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
const MAX_REFS = 6
const MIN_SCORE = 70
const CONTENT_TYPES = ['article', 'headline', 'rankings', 'fantasyFootball']
const NFL_DRAFT_TAG_SLUGS = new Set([
  'nfl-draft',
  'nfl-mock-draft',
  'draft-prospects',
  'draft-order',
  'draft-big-board',
  'nfl-combine',
  'pro-day',
  'senior-bowl',
  'undrafted-free-agents',
])

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

if (WRITE && !token) {
  console.error('Missing SANITY write token. Set SANITY_WRITE_TOKEN or run without --write.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

const GENERIC_TERMS = new Set([
  'nfl',
  'football',
  'news',
  'analysis',
  'rankings',
  'team',
  'teams',
  'game',
  'games',
])

const HEURISTIC_RULES = [
  { slug: 'nfl-mock-draft', score: 100, pattern: /\bmock draft\b/i, titleOnly: true, skipForFantasy: true },
  { slug: 'draft-big-board', score: 95, pattern: /\bbig board\b/i, skipForFantasy: true },
  { slug: 'draft-prospects', score: 90, pattern: /\bprospects?\b|\bscouting\b/i, skipForFantasy: true },
  {
    slug: 'nfl-draft',
    score: 86,
    pattern: /\bnfl draft\b|\bdraft round\b|\bround 1\b|\bfirst-round\b/i,
    titleOnly: true,
    skipForFantasy: true,
  },
  { slug: 'nfl-free-agency', score: 92, pattern: /\bfree agenc(y|ies)\b|\bfree agents?\b/i, titleOnly: true },
  { slug: 'franchise-tag', score: 95, pattern: /\bfranchise tag\b/i, titleOnly: true },
  { slug: 'nfl-salary-cap', score: 90, pattern: /\bsalary cap\b|\bcap space\b/i, titleOnly: true },
  {
    slug: 'trade-rumors',
    score: 88,
    pattern:
      /\btrade rumors?\b|\btrade buzz\b|\btrade deadline\b|\btraded\b|\bin trade with\b|\btrade with\b|\btrade for\b|\btrade candidates?\b|\bwill\b[^.?!]{0,80}\btrade\b|\btrade\b[^.?!]{0,80}\?/i,
    titleOnly: true,
  },
  {
    slug: 'nfl-coaching-cycle',
    score: 90,
    pattern:
      /\bcoaching cycle\b|\bhead coach(?:ing)? search\b|\bcoach(?:ing)? vacancy\b|\bcoach(?:ing)? hires?\b|\bfired\b|\bhired\b|\bcoordinator interview\b/i,
    titleOnly: true,
  },
  { slug: 'fantasy-football', score: 100, pattern: /\bfantasy\b/i },
  { slug: 'fantasy-rankings', score: 92, pattern: /\bfantasy rankings?\b/i },
  { slug: 'power-rankings', score: 100, pattern: /\bpower rankings?\b/i },
  { slug: 'team-rankings', score: 88, pattern: /\bteam rankings?\b|\branking all\b/i },
  { slug: 'super-bowl', score: 92, pattern: /\bsuper bowl\b/i },
  { slug: 'nfl-playoffs', score: 88, pattern: /\bplayoffs?\b|\bpostseason\b/i },
  { slug: 'playoff-picture', score: 92, pattern: /\bplayoff picture\b/i },
  { slug: 'injury-report', score: 86, pattern: /\binjur(y|ies)\b|\bsurgery\b|\bpractice report\b/i },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function slugToWords(value) {
  return normalize(String(value || '').replace(/-/g, ' '))
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map(normalize).filter(Boolean)))
}

function phraseMatches(text, term) {
  if (!text || !term) return false
  const normalizedText = ` ${normalize(text)} `
  const normalizedTerm = normalize(term)
  if (!normalizedTerm || GENERIC_TERMS.has(normalizedTerm)) return false
  return normalizedText.includes(` ${normalizedTerm} `)
}

function toRef(id) {
  return { _type: 'reference', _ref: id }
}

function refIds(refs) {
  return Array.isArray(refs) ? refs.map((ref) => ref?._ref).filter(Boolean) : []
}

function isNflDraftTag(tag) {
  return NFL_DRAFT_TAG_SLUGS.has(tag?.slug)
}

function tagCanMatchText(tag, text) {
  if (tag?.slug === 'pro-bowl-games') {
    return /\bpro bowl games?\b|\ball-star game\b|\bnfl all-star\b/i.test(text)
  }

  return true
}

async function fetchAdvancedTags() {
  const tags = await client.fetch(
    `*[_type == "advancedTag" && defined(title)]{
      _id,
      title,
      "slug": slug.current,
      aliases
    }`
  )

  const byLookup = new Map()
  const bySlug = new Map()

  for (const tag of tags) {
    const terms = uniqueStrings([
      tag.title,
      tag.slug,
      slugToWords(tag.slug),
      ...(Array.isArray(tag.aliases) ? tag.aliases : []),
    ]).filter((term) => term.length >= 3 && !GENERIC_TERMS.has(term))

    bySlug.set(tag.slug, tag)

    for (const term of terms) {
      if (!byLookup.has(term)) byLookup.set(term, tag)
    }
  }

  return { tags, byLookup, bySlug }
}

function addCandidate(candidates, tag, score, reason) {
  if (!tag?._id) return
  const existing = candidates.get(tag._id)
  if (!existing || score > existing.score) {
    candidates.set(tag._id, { tag, score, reason })
  }
}

function scoreDocument(doc, tagIndex) {
  const candidates = new Map()
  const text = [doc.title, doc.summary, doc.category?.title, doc.format, doc._type].filter(Boolean).join(' ')
  const titleContext = [doc.title, doc.category?.title].filter(Boolean).join(' ')
  const title = doc.title || ''
  const summary = doc.summary || ''
  const categoryTitle = doc.category?.title || ''
  const isFantasy =
    doc.format === 'fantasy' ||
    (Array.isArray(doc.additionalFormats) && doc.additionalFormats.includes('fantasy')) ||
    doc._type === 'fantasyFootball'

  for (const raw of Array.isArray(doc.tags) ? doc.tags : []) {
    const tag = tagIndex.byLookup.get(normalize(raw))
    if (isFantasy && isNflDraftTag(tag)) continue
    if (tag) addCandidate(candidates, tag, 120, `legacy tag "${raw}"`)
  }

  for (const rule of HEURISTIC_RULES) {
    const tag = tagIndex.bySlug.get(rule.slug)
    if (rule.skipForFantasy && isFantasy) continue
    const targetText = rule.titleOnly ? titleContext : text
    if (tag && rule.pattern.test(targetText)) addCandidate(candidates, tag, rule.score, `matched ${rule.slug}`)
  }

  if (isFantasy) {
    addCandidate(candidates, tagIndex.bySlug.get('fantasy-football'), 115, 'fantasy format')
  }

  if (doc.format === 'powerRankings') {
    addCandidate(candidates, tagIndex.bySlug.get('power-rankings'), 120, 'powerRankings format')
    addCandidate(candidates, tagIndex.bySlug.get('team-rankings'), 90, 'powerRankings format')
  }

  for (const tag of tagIndex.tags) {
    if (isFantasy && isNflDraftTag(tag)) continue
    if (!tagCanMatchText(tag, text)) continue

    const terms = uniqueStrings([
      tag.title,
      tag.slug,
      slugToWords(tag.slug),
      ...(Array.isArray(tag.aliases) ? tag.aliases : []),
    ])

    for (const term of terms) {
      if (phraseMatches(title, term)) {
        addCandidate(candidates, tag, 88, `title contains "${term}"`)
        break
      }
      if (phraseMatches(categoryTitle, term)) {
        addCandidate(candidates, tag, 78, `category contains "${term}"`)
        break
      }
      if (phraseMatches(summary, term)) {
        addCandidate(candidates, tag, 68, `summary contains "${term}"`)
      }
    }
  }

  return Array.from(candidates.values())
    .filter((candidate) => candidate.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.tag.title.localeCompare(b.tag.title))
}

async function fetchDocs() {
  const query = `*[
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
    tags,
    tagRefs[]{ _ref },
    category->{ title, slug }
  }`
  const docs = await client.fetch(query, { types: CONTENT_TYPES })
  return Number.isFinite(LIMIT) && LIMIT > 0 ? docs.slice(0, LIMIT) : docs
}

async function main() {
  console.log(`Starting canonical tagRefs backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)

  const tagIndex = await fetchAdvancedTags()
  const docs = await fetchDocs()
  console.log(`Loaded ${tagIndex.tags.length} advanced tags and ${docs.length} published content docs.`)

  let changed = 0
  let skipped = 0
  let alreadyFull = 0

  for (const doc of docs) {
    const existingIds = refIds(doc.tagRefs)
    const existingSet = new Set(existingIds)
    if (existingIds.length >= MAX_REFS) {
      alreadyFull++
      continue
    }

    const additions = scoreDocument(doc, tagIndex)
      .filter((candidate) => !existingSet.has(candidate.tag._id))
      .slice(0, Math.max(0, MAX_REFS - existingIds.length))

    if (!additions.length) {
      skipped++
      continue
    }

    const nextRefs = [...existingIds.map(toRef), ...additions.map((candidate) => toRef(candidate.tag._id))]
    changed++
    const label = `${doc._type}${doc.format ? `/${doc.format}` : ''} ${doc.slug?.current || doc._id}`
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${label}`)
    console.log(`  ${doc.title}`)
    for (const addition of additions) {
      console.log(`  + ${addition.tag.title} (${addition.score}) - ${addition.reason}`)
    }

    if (!DRY_RUN) {
      await client.patch(doc._id).set({ tagRefs: nextRefs }).commit({ autoGenerateArrayKeys: true })
      await sleep(75)
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped, ${alreadyFull} already at ${MAX_REFS}+ refs.`)
  if (DRY_RUN && token) {
    console.log('Run again with --write to apply these conservative tagRef additions.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
// Backfill stored Sanity SEO fields and safe summaries for published content.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-seo-metadata.mjs
//   node scripts/backfill-seo-metadata.mjs --write

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
const WRITE_SUMMARIES = process.argv.includes('--summaries')
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? Number.parseInt(LIMIT_ARG.split('=')[1] || '', 10) : null
const CONTENT_TYPES = ['article', 'headline', 'rankings', 'fantasyFootball']

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

if (WRITE && !token) {
  console.error('Missing Sanity write token. Set SANITY_WRITE_TOKEN or run without --write.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function compactWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function stripMarkdown(value) {
  return compactWhitespace(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`>]+/g, '')
    .replace(/\s+([,.!?;:])/g, '$1')
}

function truncateWords(value, maxLength) {
  const input = compactWhitespace(value)
  if (input.length <= maxLength) return input

  const truncated = input.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  const candidate = lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated
  return candidate.trim().replace(/[,:;/-]+$/, '') + '...'
}

function textFromChildren(children) {
  if (!Array.isArray(children)) return ''
  return compactWhitespace(children.map((child) => child?.text || '').join(' '))
}

function normalizeForCompare(value) {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function removeTitlePrefix(text, title) {
  const normalizedText = normalizeForCompare(text)
  const normalizedTitle = normalizeForCompare(title)
  if (!normalizedText || !normalizedTitle) return text
  if (!normalizedText.startsWith(normalizedTitle)) return text

  const words = normalizedTitle.split(' ')
  const textWords = compactWhitespace(text).split(' ')
  return textWords.slice(words.length).join(' ').trim()
}

function protectAbbreviations(text) {
  return text
    .replace(/\bNo\.\s+/g, 'No<DOT> ')
    .replace(/\bU\.S\./g, 'U<DOT>S<DOT>')
    .replace(/\bN\.F\.L\./g, 'N<DOT>F<DOT>L<DOT>')
}

function restoreAbbreviations(text) {
  return text.replace(/<DOT>/g, '.')
}

function isCleanSummaryCandidate(text) {
  const value = compactWhitespace(text)
  if (value.length < 90) return false
  if (/^\d+[\s).:-]/.test(value)) return false
  if (/^[a-z]/.test(value)) return false
  if (/\b([A-Za-z]{3,})\s+\1\b/i.test(value)) return false
  if (/\s[,.!?;:]/.test(value)) return false
  return true
}

function portableTextToParagraphs(blocks, title) {
  if (!Array.isArray(blocks)) return []

  return blocks
    .filter((block) => block?._type === 'block')
    .filter((block) => !block.style || block.style === 'normal')
    .map((block) => stripMarkdown(removeTitlePrefix(textFromChildren(block.children), title)))
    .filter((text) => text.length >= 45)
    .filter((text) => !/^read more\b/i.test(text))
    .filter((text) => !normalizeForCompare(title).startsWith(normalizeForCompare(text)))
}

function sentenceCandidates(text) {
  const cleaned = protectAbbreviations(stripMarkdown(text))
  if (!cleaned) return []
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => restoreAbbreviations(sentence.trim()))
    .filter((sentence) => sentence.length >= 35)
}

function deriveSummary(doc) {
  const paragraphs = [
    ...portableTextToParagraphs(doc.body, doc.title),
    ...portableTextToParagraphs(doc.rankingIntro, doc.title),
    ...portableTextToParagraphs(doc.rankingConclusion, doc.title),
  ]

  const sentences = []
  for (const paragraph of paragraphs.slice(0, 6)) {
    sentences.push(...sentenceCandidates(paragraph))
    if (sentences.join(' ').length >= 180) break
  }

  const source = sentences.length > 0 ? sentences.slice(0, 2).join(' ') : paragraphs.slice(0, 2).join(' ')
  if (!isCleanSummaryCandidate(source)) return ''

  return truncateWords(source, 260)
}

function coverageLabel(doc) {
  const category = compactWhitespace(doc.category?.title).toLowerCase()
  if (doc._type === 'fantasyFootball' || doc.format === 'fantasy' || category === 'fantasy') return 'fantasy football coverage'
  if (category === 'headlines') return 'NFL coverage'
  if (category === 'player news') return 'NFL player news'
  if (category.includes('betting')) return 'NFL betting coverage'
  if (category.includes('draft')) return 'NFL draft coverage'
  if (category && category !== 'nfl') return `NFL ${category} coverage`
  return 'NFL coverage'
}

function deriveDescription(doc, summary, generatedSummary = '') {
  const existingSummary = compactWhitespace(summary)
  const existingUsable = existingSummary && !isWeakSummary(existingSummary)
  const source = existingUsable && existingSummary.length >= 90 ? existingSummary : generatedSummary
  if (source.length >= 90) return truncateWords(source, 155)

  const title = compactWhitespace(doc.title)
  const coverage = coverageLabel(doc)
  if (existingUsable && existingSummary.length >= 45) {
    return truncateWords(`${existingSummary} More ${coverage} from The Snap, with context and analysis for NFL fans.`, 155)
  }

  return truncateWords(
    `${title}: ${coverage} from The Snap, with news, context, analysis, and the key storylines NFL fans need to know.`,
    155
  )
}

function titleCaseKeyword(value) {
  return compactWhitespace(value)
    .replace(/^nfl\b/i, 'NFL')
    .replace(/\bqb\b/gi, 'QB')
}

function deriveKeywords(doc) {
  const candidates = []
  const tagTitles = Array.isArray(doc.tagRefs) ? doc.tagRefs.map((tag) => tag?.title).filter(Boolean) : []
  const categoryTitle = doc.category?.title

  if (doc.format === 'powerRankings') {
    const year = doc.seasonYear || new Date().getFullYear()
    candidates.push(`nfl power rankings ${year}`)
  }

  if (tagTitles.length > 0) {
    candidates.push(...tagTitles.slice(0, 5).map((tag) => tag.toLowerCase()))
  }

  if (categoryTitle) {
    candidates.push(`nfl ${categoryTitle.toLowerCase()}`)
  }

  const unique = Array.from(new Set(candidates.map((candidate) => compactWhitespace(candidate)).filter(Boolean)))
  return {
    focusKeyword: unique[0],
    additionalKeywords: unique.slice(1, 6),
  }
}

function deriveMetaTitle(doc, focusKeyword) {
  const base = compactWhitespace(doc.title) || 'NFL News'
  const branded = /the snap/i.test(base) ? base : `${base} | The Snap`
  if (branded.length <= 60) return branded

  const unbranded = truncateWords(base, 49)
  if (unbranded.length <= 49) return `${unbranded} | The Snap`

  const focus = focusKeyword ? titleCaseKeyword(focusKeyword) : 'NFL News'
  return truncateWords(`${focus} | The Snap`, 60)
}

function isWeakSummary(summary) {
  const text = compactWhitespace(summary)
  if (!text) return true
  if (text.length < 90) return true
  if (/^(a|an)\s+[^.]{0,80}\bgraphic\b/i.test(text)) return true
  if (/^read the latest nfl news/i.test(text)) return true
  return false
}

function hasMeaningfulSeoValue(value) {
  return typeof value === 'string' && compactWhitespace(value).length > 0
}

function isWeakMetaDescription(value) {
  const text = compactWhitespace(value)
  if (!text) return true
  if (text.length < 90) return true
  if (/^read the latest\b/i.test(text)) return true
  return false
}

function buildPatch(doc) {
  const existingSeo = doc.seo || {}
  if (existingSeo.autoGenerate === false) return null

  const patch = {}
  const reasons = []
  const generatedSummary = deriveSummary(doc)
  const existingSummary = compactWhitespace(doc.summary)

  if (WRITE_SUMMARIES && isWeakSummary(existingSummary) && generatedSummary && generatedSummary !== existingSummary) {
    patch.summary = generatedSummary
    reasons.push(existingSummary ? 'improve short summary' : 'add summary')
  }

  const summaryForSeo = compactWhitespace(patch.summary || existingSummary)
  const metaDescription = deriveDescription(doc, summaryForSeo, generatedSummary)
  const { focusKeyword, additionalKeywords } = deriveKeywords(doc)
  const metaTitle = deriveMetaTitle(doc, existingSeo.focusKeyword || focusKeyword)

  const nextSeo = {
    ...existingSeo,
    autoGenerate: existingSeo.autoGenerate ?? true,
  }

  if (!hasMeaningfulSeoValue(existingSeo.metaTitle)) {
    nextSeo.metaTitle = metaTitle
    reasons.push('add metaTitle')
  }

  if (isWeakMetaDescription(existingSeo.metaDescription)) {
    nextSeo.metaDescription = metaDescription
    reasons.push(hasMeaningfulSeoValue(existingSeo.metaDescription) ? 'improve metaDescription' : 'add metaDescription')
  }

  if (!hasMeaningfulSeoValue(existingSeo.ogTitle)) {
    nextSeo.ogTitle = nextSeo.metaTitle || metaTitle
    reasons.push('add ogTitle')
  }

  if (!hasMeaningfulSeoValue(existingSeo.ogDescription)) {
    nextSeo.ogDescription = nextSeo.metaDescription || metaDescription
    reasons.push('add ogDescription')
  }

  if (!hasMeaningfulSeoValue(existingSeo.focusKeyword) && focusKeyword) {
    nextSeo.focusKeyword = focusKeyword
    reasons.push('add focusKeyword')
  }

  if ((!Array.isArray(existingSeo.additionalKeywords) || existingSeo.additionalKeywords.length === 0) && additionalKeywords.length > 0) {
    nextSeo.additionalKeywords = additionalKeywords
    reasons.push('add additionalKeywords')
  }

  if (reasons.some((reason) => reason.startsWith('add ') || reason.startsWith('improve '))) {
    nextSeo.lastGenerated = new Date().toISOString()
    patch.seo = nextSeo
  }

  return Object.keys(patch).length > 0 ? { patch, reasons, generatedSummary, metaDescription, metaTitle } : null
}

async function fetchDocs() {
  const docs = await client.fetch(
    `*[
      _type in $types &&
      published == true &&
      !(_id in path("drafts.**")) &&
      (!defined(seo.noIndex) || seo.noIndex == false)
    ] | order(coalesce(date, publishedAt, _createdAt) desc) {
      _id,
      _type,
      title,
      format,
      rankingType,
      seasonYear,
      weekNumber,
      playoffRound,
      slug,
      summary,
      seo,
      category->{ title },
      tagRefs[]->{ title },
      body[]{
        _type,
        style,
        children[]{ text }
      },
      rankingIntro[]{
        _type,
        style,
        children[]{ text }
      },
      rankingConclusion[]{
        _type,
        style,
        children[]{ text }
      }
    }`,
    { types: CONTENT_TYPES }
  )

  return Number.isFinite(LIMIT) && LIMIT > 0 ? docs.slice(0, LIMIT) : docs
}

async function main() {
  console.log(
    `Starting SEO metadata backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}${WRITE_SUMMARIES ? ' [SUMMARIES]' : ''}`
  )

  const docs = await fetchDocs()
  console.log(`Loaded ${docs.length} published, indexable content docs.`)

  let changed = 0
  let skipped = 0
  let manualSeo = 0

  for (const doc of docs) {
    if (doc.seo?.autoGenerate === false) {
      manualSeo++
      continue
    }

    const result = buildPatch(doc)
    if (!result) {
      skipped++
      continue
    }

    changed++
    const label = `${doc._type}${doc.format ? `/${doc.format}` : ''} ${doc.slug?.current || doc._id}`
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${label}`)
    console.log(`  ${doc.title}`)
    console.log(`  reasons: ${result.reasons.join(', ')}`)
    if (result.patch.summary) console.log(`  summary: ${result.patch.summary}`)
    if (result.patch.seo?.metaDescription) console.log(`  metaDescription: ${result.patch.seo.metaDescription}`)

    if (!DRY_RUN) {
      await client.patch(doc._id).set(result.patch).commit({ autoGenerateArrayKeys: true })
      await sleep(75)
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped, ${manualSeo} manual SEO skipped.`)
  if (DRY_RUN && token) {
    console.log('Run again with --write to apply these SEO metadata additions.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

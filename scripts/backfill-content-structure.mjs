#!/usr/bin/env node
// Backfill safe editorial summaries and Portable Text section structure.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-content-structure.mjs
//   node scripts/backfill-content-structure.mjs --write

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

function normalizeForCompare(value) {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function stripInlineNoise(value) {
  return compactWhitespace(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`>]+/g, '')
    .replace(/\s+([,.!?;:])/g, '$1')
}

function protectAbbreviations(text) {
  return text
    .replace(/\bNo\.\s+/g, 'No<DOT> ')
    .replace(/\bU\.S\./g, 'U<DOT>S<DOT>')
    .replace(/\bMr\.\s+/g, 'Mr<DOT> ')
    .replace(/\bMrs\.\s+/g, 'Mrs<DOT> ')
    .replace(/\bDr\.\s+/g, 'Dr<DOT> ')
    .replace(/\bSt\.\s+/g, 'St<DOT> ')
    .replace(/\bJan\.\s+/g, 'Jan<DOT> ')
    .replace(/\bFeb\.\s+/g, 'Feb<DOT> ')
    .replace(/\bMar\.\s+/g, 'Mar<DOT> ')
    .replace(/\bApr\.\s+/g, 'Apr<DOT> ')
    .replace(/\bJun\.\s+/g, 'Jun<DOT> ')
    .replace(/\bJul\.\s+/g, 'Jul<DOT> ')
    .replace(/\bAug\.\s+/g, 'Aug<DOT> ')
    .replace(/\bSept\.\s+/g, 'Sept<DOT> ')
    .replace(/\bSep\.\s+/g, 'Sep<DOT> ')
    .replace(/\bOct\.\s+/g, 'Oct<DOT> ')
    .replace(/\bNov\.\s+/g, 'Nov<DOT> ')
    .replace(/\bDec\.\s+/g, 'Dec<DOT> ')
}

function restoreAbbreviations(text) {
  return text.replace(/<DOT>/g, '.')
}

function blockText(block) {
  if (!block || block._type !== 'block') return ''
  return compactWhitespace((block.children || []).map((child) => child?.text || '').join(' '))
}

function removeTitlePrefix(text, title) {
  const normalizedText = normalizeForCompare(text)
  const normalizedTitle = normalizeForCompare(title)
  if (!normalizedText || !normalizedTitle || !normalizedText.startsWith(normalizedTitle)) return text

  const words = normalizedTitle.split(' ')
  return compactWhitespace(text).split(' ').slice(words.length).join(' ').trim()
}

function removeLeadingStandaloneLabel(text) {
  const value = compactWhitespace(text)
  const match = value.match(/^([A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+){0,3})\s+(The|A|An|After|Before|With|In|Rookie|Veteran|Kansas|Cleveland|New York|Washington|Buffalo|Dallas|Green Bay|Philadelphia|Pittsburgh|Tennessee)\b/)
  if (!match) return value

  const labelWords = match[1].split(/\s+/)
  const lastLabelWord = labelWords[labelWords.length - 1]?.toLowerCase()
  const nextWords = value.slice(match[1].length).trim().split(/\s+/).slice(0, 4).map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
  if (!lastLabelWord || !nextWords.includes(lastLabelWord.replace(/[^a-z]/g, ''))) return value

  return value.slice(match[1].length).trim()
}

function isBlankBlock(block) {
  return block?._type === 'block' && !blockText(block)
}

function isLikelyHeadingText(text) {
  const value = compactWhitespace(text)
  if (value.length < 4 || value.length > 90) return false
  if (/[.!?]$/.test(value)) return false
  if (/^\d+[\s).:-]/.test(value)) return false
  if (/^[A-Z]{2,4}$/.test(value)) return true
  if (/^(nfc|afc)$/i.test(value)) return true
  if (/^(picks|pick|round|day|tier)\s+\d+/i.test(value)) return true
  if (/^(why|what|how|where|when|key|updated|wild card|divisional|conference championship|final thoughts|bottom line|the big question|from |late-career|peak years|methodology|takeaways?|grades?)/i.test(value)) {
    return true
  }
  if (value.includes(':') && value.split(/\s+/).length <= 12) return true

  const words = value.split(/\s+/).filter(Boolean)
  if (words.length > 12) return false
  const meaningful = words.filter((word) => /[a-zA-Z]/.test(word))
  if (meaningful.length < 2) return false
  const titleCase = meaningful.filter((word) => /^[A-Z0-9]/.test(word) || /^(and|or|the|of|for|to|in|on|with|from)$/i.test(word))
  return titleCase.length / meaningful.length >= 0.75
}

function shouldPromoteNormalBlock(block, index, body) {
  if (block?._type !== 'block') return false
  if (block.style && block.style !== 'normal') return false

  const text = stripInlineNoise(blockText(block))
  if (!isLikelyHeadingText(text)) return false

  const prev = body[index - 1]
  const next = body.slice(index + 1).find((candidate) => !isBlankBlock(candidate))
  const nextText = blockText(next)
  const startsSection = index <= 2 || isBlankBlock(prev) || prev?.style === 'h2' || prev?.style === 'h3'

  return startsSection && nextText.length >= 70
}

function cleanBody(doc) {
  const body = Array.isArray(doc.body) ? doc.body : []
  if (body.length < 8) return null

  let changed = false
  let promoted = 0
  let removedBlanks = 0
  const hasH2 = body.some((block) => block?.style === 'h2')
  const allowHeadingPromotion = !hasH2

  const nextBody = []

  body.forEach((block, index) => {
    if (isBlankBlock(block)) {
      changed = true
      removedBlanks++
      return
    }

    if (allowHeadingPromotion && block?._type === 'block' && block.style === 'h3') {
      nextBody.push({ ...block, style: 'h2' })
      changed = true
      promoted++
      return
    }

    if (allowHeadingPromotion && shouldPromoteNormalBlock(block, index, body)) {
      nextBody.push({ ...block, style: 'h2' })
      changed = true
      promoted++
      return
    }

    nextBody.push(block)
  })

  if (!changed) return null
  if (promoted === 0 && removedBlanks < 2) return null

  return { body: nextBody, promoted, removedBlanks }
}

function isWeakSummary(summary) {
  const text = compactWhitespace(summary)
  if (!text) return true
  if (text.length < 90) return true
  if (/^(a|an)\s+[^.]{0,80}\bgraphic\b/i.test(text)) return true
  if (/^read the latest\b/i.test(text)) return true
  return false
}

function isBadSummaryCandidate(text) {
  const value = compactWhitespace(text)
  if (value.length < 90 || value.length > 300) return true
  if (/^\d+[\s).:-]/.test(value)) return true
  if (/^[a-z]/.test(value)) return true
  if (/\b([A-Za-z]{3,})\s+\1\b/i.test(value)) return true
  if (/\b(supeior|montogomery)\b/i.test(value)) return true
  if (/^commentary:/i.test(value)) return true
  if (/^["'“”‘’]/.test(value)) return true
  if (/\s[,.!?;:]/.test(value)) return true
  return false
}

function isBadSentenceFragment(text) {
  const value = compactWhitespace(text)
  if (!value) return true
  if (/^\d+[\s).:-]/.test(value)) return true
  if (/^[a-z]/.test(value)) return true
  if (/\b([A-Za-z]{3,})\s+\1\b/i.test(value)) return true
  if (/\b(supeior|montogomery)\b/i.test(value)) return true
  if (/^commentary:/i.test(value)) return true
  if (/^["'“”‘’]/.test(value)) return true
  if (/\s[,.!?;:]/.test(value)) return true
  return false
}

function sentenceCandidates(text) {
  const cleaned = protectAbbreviations(stripInlineNoise(text))
  if (!cleaned) return []
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => restoreAbbreviations(sentence.trim()))
    .filter((sentence) => sentence.length >= 45)
}

function summaryParagraphs(doc) {
  const title = doc.title || ''
  const body = Array.isArray(doc.body) ? doc.body : []
  const paragraphs = []

  for (const block of body) {
    if (block?._type !== 'block') continue
    const text = stripInlineNoise(removeLeadingStandaloneLabel(removeTitlePrefix(blockText(block), title)))
    if (!text || text.length < 55) continue
    if (block.style && block.style !== 'normal') continue
    if (isLikelyHeadingText(text)) continue
    if (/^\d+[\s).:-]/.test(text)) continue
    if (normalizeForCompare(title).startsWith(normalizeForCompare(text))) continue
    paragraphs.push(text)
  }

  return paragraphs
}

function deriveSummary(doc) {
  const sentences = []

  for (const paragraph of summaryParagraphs(doc).slice(0, 8)) {
    for (const sentence of sentenceCandidates(paragraph)) {
      if (isBadSentenceFragment(sentence)) continue
      sentences.push(sentence)
      if (sentences.join(' ').length >= 170) break
    }
    if (sentences.join(' ').length >= 170) break
  }

  if (!sentences.length) return ''

  const first = sentences[0]
  const candidate = first.length >= 110 ? first : sentences.slice(0, 2).join(' ')
  if (isBadSummaryCandidate(candidate)) return ''
  return candidate
}

function buildPatch(doc) {
  const patch = {}
  const reasons = []

  const generatedSummary = deriveSummary(doc)
  if (isWeakSummary(doc.summary) && generatedSummary && generatedSummary !== compactWhitespace(doc.summary)) {
    patch.summary = generatedSummary
    reasons.push(compactWhitespace(doc.summary) ? 'improve summary' : 'add summary')
  }

  const bodyPatch = cleanBody(doc)
  if (bodyPatch) {
    patch.body = bodyPatch.body
    if (bodyPatch.promoted > 0) reasons.push(`promote ${bodyPatch.promoted} section heading(s) to H2`)
    if (bodyPatch.removedBlanks > 0) reasons.push(`remove ${bodyPatch.removedBlanks} empty body block(s)`)
  }

  return Object.keys(patch).length > 0 ? { patch, reasons } : null
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
      slug,
      summary,
      body[]{ ... }
    }`,
    { types: CONTENT_TYPES }
  )

  return Number.isFinite(LIMIT) && LIMIT > 0 ? docs.slice(0, LIMIT) : docs
}

async function main() {
  console.log(`Starting content structure backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)

  const docs = await fetchDocs()
  console.log(`Loaded ${docs.length} published, indexable content docs.`)

  let changed = 0
  let skipped = 0

  for (const doc of docs) {
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

    if (!DRY_RUN) {
      await client.patch(doc._id).set(result.patch).commit({ autoGenerateArrayKeys: true })
      await sleep(75)
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped.`)
  if (DRY_RUN && token) {
    console.log('Run again with --write to apply these summary and structure edits.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

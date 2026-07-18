#!/usr/bin/env node

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const applyChanges = process.argv.includes('--apply')
const showText = process.argv.includes('--show-text')

const canonicalId = '311b265b-02e8-4dc8-bb0c-1fb2091b9570'
const duplicateId = 'c5dc688b-bfbc-440e-97e4-b65fcbf72de4'
const canonicalSlug = 'nfl-betting-odds-explained-spreads-moneylines-totals-and-more'
const duplicateSlug = 'how-to-read-nfl-betting-odds-spreads-moneylines-totals-and-more'

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required')
if (applyChanges && !token) throw new Error('A Sanity write token is required with --apply')

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

function blockText(block) {
  if (block?._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children.map((child) => child?.text || '').join('').trim()
}

function findHeading(body, text) {
  const index = body.findIndex(
    (block) => ['h2', 'h3'].includes(block?.style) && blockText(block) === text,
  )
  if (index === -1) throw new Error(`Required heading not found: ${text}`)
  return index
}

function rekeyBlocks(blocks, prefix) {
  return blocks.map((block, index) => ({
    ...block,
    _key: `${prefix}-${String(index + 1).padStart(3, '0')}`,
  }))
}

function renameHeading(block, replacements) {
  const replacement = replacements.get(blockText(block))
  if (!replacement || !['h2', 'h3'].includes(block?.style)) return block

  return {
    ...block,
    children: [
      {
        _type: 'span',
        _key: 'heading-text',
        marks: [],
        text: replacement,
      },
    ],
  }
}

function makeHubLinkBlock() {
  const linkKey = 'nfl-betting-hub-link'
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [{_type: 'link', _key: linkKey, href: '/nfl-betting'}],
    children: [
      {_type: 'span', _key: 'hub-prefix', marks: [], text: 'Next: Browse '},
      {
        _type: 'span',
        _key: 'hub-link-text',
        marks: [linkKey],
        text: "The Snap's NFL betting hub",
      },
      {
        _type: 'span',
        _key: 'hub-suffix',
        marks: [],
        text: ' for current futures, win totals, odds analysis, and related explainers.',
      },
    ],
  }
}

function makeResponsibleBettingBlock() {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'responsible-betting-text',
        marks: ['strong'],
        text: 'Remember: ',
      },
      {
        _type: 'span',
        _key: 'responsible-betting-copy',
        marks: [],
        text: 'Betting outcomes are uncertain. Set limits and never risk money you cannot afford to lose.',
      },
    ],
  }
}

function bodyCharacters(body) {
  return body.map(blockText).filter(Boolean).join('\n').length
}

function bodyPlainText(body) {
  return body.map(blockText).filter(Boolean).join('\n\n')
}

function bodyHeadings(body) {
  return body
    .filter((block) => ['h2', 'h3'].includes(block?.style))
    .map((block) => ({style: block.style, text: blockText(block)}))
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))]
}

function buildMergedBody(canonicalBody, duplicateBody) {
  const canonicalExtrasStart = findHeading(
    canonicalBody,
    'Common NFL bet types beyond the basics',
  )
  const canonicalMistakeStart = findHeading(
    canonicalBody,
    'The biggest mistake beginners make',
  )
  const canonicalConclusionStart = findHeading(canonicalBody, 'Final takeaway')

  const duplicateBetTypesStart = findHeading(duplicateBody, 'How parlays work')
  const duplicateBeginnerStart = findHeading(
    duplicateBody,
    'How beginners should read an NFL odds board',
  )
  const duplicateBottomLineStart = findHeading(duplicateBody, 'Bottom line')
  const duplicateFaqStart = findHeading(duplicateBody, 'FAQ')

  if (
    !(canonicalExtrasStart < canonicalMistakeStart &&
      canonicalMistakeStart < canonicalConclusionStart)
  ) {
    throw new Error('Canonical guide section order changed; refusing to merge')
  }
  if (
    !(duplicateBetTypesStart < duplicateBeginnerStart &&
      duplicateBeginnerStart < duplicateBottomLineStart &&
      duplicateBottomLineStart < duplicateFaqStart)
  ) {
    throw new Error('Duplicate guide section order changed; refusing to merge')
  }

  const headingReplacements = new Map([
    ['NFL Betting Odds Explained', 'NFL betting odds at a glance'],
    ['Point spread explained', 'How NFL point spreads work'],
    ['Moneyline explained', 'How NFL moneyline bets work'],
    ['Totals, also called over/under', 'How NFL over/under totals work'],
    ['Implied probability', 'How NFL odds show implied probability'],
    ['FAQ', 'NFL betting odds FAQ'],
    ['Key Terms', 'Key NFL betting terms'],
  ])
  const assembledBody = [
    ...canonicalBody.slice(0, canonicalExtrasStart),
    ...duplicateBody.slice(duplicateBetTypesStart, duplicateBottomLineStart),
    ...canonicalBody.slice(canonicalMistakeStart, canonicalConclusionStart),
    ...duplicateBody.slice(duplicateFaqStart),
    makeHubLinkBlock(),
    makeResponsibleBettingBlock(),
    ...canonicalBody.slice(canonicalConclusionStart),
  ].map((block) => renameHeading(block, headingReplacements))

  return rekeyBlocks(assembledBody, 'betting-guide')
}

async function main() {
  const ids = [
    canonicalId,
    `drafts.${canonicalId}`,
    duplicateId,
    `drafts.${duplicateId}`,
  ]
  const docs = await client.fetch(
    `*[_id in $ids]{
      _id,
      _rev,
      _type,
      title,
      slug,
      slugHistory,
      published,
      body
    }`,
    {ids},
  )

  const drafts = docs.filter((doc) => doc._id.startsWith('drafts.'))
  if (drafts.length) {
    throw new Error(
      `Unpublished Studio drafts exist (${drafts.map((doc) => doc._id).join(', ')}); refusing to overwrite them`,
    )
  }

  const canonical = docs.find((doc) => doc._id === canonicalId)
  const duplicate = docs.find((doc) => doc._id === duplicateId)
  if (!canonical || !duplicate) throw new Error('Both expected article documents are required')
  if (canonical._type !== 'article' || duplicate._type !== 'article') {
    throw new Error('Both expected documents must be articles')
  }
  if (canonical.slug?.current !== canonicalSlug) {
    throw new Error(`Canonical slug changed: ${canonical.slug?.current || '(missing)'}`)
  }
  if (duplicate.slug?.current !== duplicateSlug) {
    throw new Error(`Duplicate slug changed: ${duplicate.slug?.current || '(missing)'}`)
  }
  if (canonical.published !== true || duplicate.published !== true) {
    throw new Error('Both guides must still be published before the first consolidation run')
  }

  const mergedBody = buildMergedBody(canonical.body || [], duplicate.body || [])
  const slugHistory = uniqueStrings([...(canonical.slugHistory || []), duplicateSlug])
  const updatedAt = new Date().toISOString()
  const summary =
    'Learn how to read NFL betting odds in plain English, including point spreads, moneylines, totals, -110 pricing, implied probability, line movement, parlays, props, teasers, and futures.'
  const metaDescription =
    'Learn how NFL betting odds work, including point spreads, moneylines, totals, -110 pricing, implied probability, line movement, props, parlays, and futures.'
  const seo = {
    _type: 'seo',
    autoGenerate: false,
    metaTitle: 'How to Read NFL Betting Odds: Complete Guide | The Snap',
    metaDescription,
    focusKeyword: 'how to read NFL betting odds',
    additionalKeywords: [
      'NFL odds explained',
      'NFL point spreads',
      'NFL moneyline',
      'NFL over under',
      'what does -110 mean',
    ],
    ogTitle: 'NFL Betting Odds Explained: A Complete Beginner Guide',
    ogDescription: metaDescription,
    noIndex: false,
  }

  const report = {
    mode: applyChanges ? 'apply' : 'dry-run',
    retained: {
      id: canonicalId,
      url: `https://thegamesnap.com/articles/${canonicalSlug}`,
      previousBodyBlocks: canonical.body?.length || 0,
      mergedBodyBlocks: mergedBody.length,
      previousBodyCharacters: bodyCharacters(canonical.body || []),
      mergedBodyCharacters: bodyCharacters(mergedBody),
      title: 'How to Read NFL Betting Odds: Spreads, Moneylines, Totals, and More',
      summary,
      metaTitle: seo.metaTitle,
      metaTitleCharacters: seo.metaTitle.length,
      metaDescriptionCharacters: metaDescription.length,
      slugHistory,
      headings: bodyHeadings(mergedBody),
      ...(showText ? {plainText: bodyPlainText(mergedBody)} : {}),
    },
    retired: {
      id: duplicateId,
      url: `https://thegamesnap.com/articles/${duplicateSlug}`,
      action: 'Set published=false; route redirects through the retained article slugHistory',
    },
  }

  console.log(JSON.stringify(report, null, 2))

  if (!applyChanges) {
    console.log('\nDry run only. Re-run with --apply to commit this guarded transaction.')
    return
  }

  const transaction = client
    .transaction()
    .patch(canonicalId, (patch) =>
      patch.ifRevisionId(canonical._rev).set({
        title: 'How to Read NFL Betting Odds: Spreads, Moneylines, Totals, and More',
        homepageTitle: 'NFL Betting Odds Explained',
        summary,
        body: mergedBody,
        slugHistory,
        dateModified: updatedAt,
        seo,
      }),
    )
    .patch(duplicateId, (patch) =>
      patch.ifRevisionId(duplicate._rev).set({published: false}),
    )

  await transaction.commit({autoGenerateArrayKeys: true})
  console.log(`\nConsolidation committed at ${updatedAt}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

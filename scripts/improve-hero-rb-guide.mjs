#!/usr/bin/env node

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const applyChanges = process.argv.includes('--apply')

const articleId = '9b09bb24-19e0-46a0-9eb1-72e5c0cda8bd'
const articleSlug = 'what-hero-rb-means-in-fantasy-football'

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required')
if (applyChanges && !token) throw new Error('A Sanity write token is required with --apply')

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})

function blockText(block) {
  if (block?._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children.map((child) => child?.text || '').join('').trim()
}

function normalizedText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function textBlock(key, text, style = 'normal', options = {}) {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    ...(options.listItem ? {listItem: options.listItem, level: options.level || 1} : {}),
    children: [{_type: 'span', _key: `${key}-text`, marks: options.strong ? ['strong'] : [], text}],
  }
}

function linkedBlock(key, segments) {
  const markDefs = segments.flatMap((segment, index) => segment.href ? [{
      _type: 'link',
      _key: `${key}-link-${index}`,
      href: segment.href,
    }] : [])

  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs,
    children: segments.map((segment, index) => ({
      _type: 'span',
      _key: `${key}-span-${index}`,
      marks: segment.href ? [`${key}-link-${index}`] : segment.strong ? ['strong'] : [],
      text: segment.text,
    })),
  }
}

function insertBeforeHeading(body, heading, blocks) {
  if (blocks.every((block) => body.some((existing) => existing?._key === block._key))) return body
  const index = body.findIndex(
    (block) => ['h2', 'h3'].includes(block?.style) && normalizedText(blockText(block)) === normalizedText(heading),
  )
  if (index === -1) throw new Error(`Required heading was not found: ${heading}`)
  return [...body.slice(0, index), ...blocks, ...body.slice(index)]
}

function insertAfterHeading(body, heading, blocks) {
  if (blocks.every((block) => body.some((existing) => existing?._key === block._key))) return body
  const index = body.findIndex(
    (block) => ['h2', 'h3'].includes(block?.style) && normalizedText(blockText(block)) === normalizedText(heading),
  )
  if (index === -1) throw new Error(`Required heading was not found: ${heading}`)
  return [...body.slice(0, index + 1), ...blocks, ...body.slice(index + 1)]
}

function roundByRoundBlocks() {
  return [
    textBlock('hero-rb-round-plan-heading', 'A round-by-round Hero RB draft plan', 'h2'),
    textBlock(
      'hero-rb-round-plan-intro',
      'Hero RB is a structure, not a rigid list of positions. The exact picks should follow your league settings and the value on the board, but this is a practical 12-team redraft framework.',
    ),
    {
      _type: 'dataTable',
      _key: 'hero-rb-round-plan-table',
      columns: ['Draft stage', 'Primary goal', 'Running back decision', 'Why it fits Hero RB'],
      rows: [
        {
          _type: 'dataTableRow',
          _key: 'hero-rb-round-plan-row-1',
          cells: ['Rounds 1-2', 'Secure an anchor RB only at fair value', 'Take one back with a three-down or high-value-touch ceiling', 'The first RB supplies the weekly floor for the build'],
        },
        {
          _type: 'dataTableRow',
          _key: 'hero-rb-round-plan-row-2',
          cells: ['Round 3', 'Build strength at WR, TE or QB', 'Do not force RB2; take a second back only if a clear value falls', 'This is where Hero RB starts creating a positional edge'],
        },
        {
          _type: 'dataTableRow',
          _key: 'hero-rb-round-plan-row-3',
          cells: ['Rounds 4-6', 'Fill core starters and attack strong tiers', 'Monitor RB value without reaching to complete the depth chart', 'A flexible roster is more valuable than following a preset round'],
        },
        {
          _type: 'dataTableRow',
          _key: 'hero-rb-round-plan-row-4',
          cells: ['Rounds 7-10', 'Add multiple upside backs', 'Target receiving roles, ambiguous depth charts and direct paths to touches', 'Several calculated bets are better than one low-ceiling RB2'],
        },
        {
          _type: 'dataTableRow',
          _key: 'hero-rb-round-plan-row-5',
          cells: ['Round 11 and later', 'Build contingent value and bench flexibility', 'Add high-upside backups rather than touchdown-only veterans', 'Late picks should be easy to replace if their role never develops'],
        },
      ],
    },
    textBlock('hero-rb-round-three-heading', 'What should you draft in Round 3?', 'h3'),
    textBlock(
      'hero-rb-round-three-answer',
      'After opening with an anchor running back, Round 3 is usually a place to take the best wide receiver, tight end or quarterback value available. Drafting RB2 is still allowed, but it should be because the player fell past your valuation, not because the roster screen has an empty second running back slot.',
    ),
    textBlock(
      'hero-rb-round-plan-adjustment',
      'If the elite running backs are gone before your first pick, abandon the structure. Starting WR-WR and moving toward Zero RB or a balanced build is better than forcing a player into the hero role.',
    ),
  ]
}

function anchorBackBlocks() {
  return [
    textBlock('hero-rb-anchor-heading', 'How to choose the right anchor running back', 'h2'),
    textBlock(
      'hero-rb-anchor-intro',
      'The strategy works only if the first back has a realistic path to difference-making volume. Look for role quality, not just name value or last season\'s fantasy finish.',
    ),
    textBlock('hero-rb-anchor-volume', 'A secure weekly touch floor, including a clear early-down role', 'normal', {listItem: 'bullet'}),
    textBlock('hero-rb-anchor-targets', 'Passing-game usage that keeps the player involved when game script changes', 'normal', {listItem: 'bullet'}),
    textBlock('hero-rb-anchor-goalline', 'Goal-line work or an offense capable of creating regular scoring chances', 'normal', {listItem: 'bullet'}),
    textBlock('hero-rb-anchor-competition', 'Limited competition for the most valuable touches', 'normal', {listItem: 'bullet'}),
    textBlock('hero-rb-anchor-cost', 'A draft cost that still leaves access to premium receivers in the next rounds', 'normal', {listItem: 'bullet'}),
    textBlock(
      'hero-rb-anchor-warning',
      'A talented player in a three-way committee is usually a poor Hero RB foundation. The label requires both ability and a workload capable of carrying the position while you wait.',
    ),
  ]
}

function comparisonTable() {
  return {
    _type: 'dataTable',
    _key: 'hero-rb-strategy-comparison',
    columns: ['Strategy', 'Early-round approach', 'Main strength', 'Main risk', 'Best fit'],
    rows: [
      {
        _type: 'dataTableRow',
        _key: 'hero-rb-comparison-row-1',
        cells: ['Hero RB', 'Draft one elite RB early, then shift to WR, TE or QB', 'One anchor back without multiple premium RB picks', 'An injury to the anchor can expose thin depth', 'Managers who want balance and flexibility'],
      },
      {
        _type: 'dataTableRow',
        _key: 'hero-rb-comparison-row-2',
        cells: ['Zero RB', 'Wait on RB until the middle rounds', 'Maximizes early value at receiver and other positions', 'Needs late-round or waiver-wire RB hits', 'Full-PPR leagues with deep benches'],
      },
      {
        _type: 'dataTableRow',
        _key: 'hero-rb-comparison-row-3',
        cells: ['Robust RB', 'Take two or more RBs early', 'Immediate RB depth and injury insulation', 'Can leave wide receiver depth thin', 'Formats that heavily reward rushing volume'],
      },
      {
        _type: 'dataTableRow',
        _key: 'hero-rb-comparison-row-4',
        cells: ['Balanced', 'Mix RB and WR without forcing a structure', 'Easy to adjust as the board changes', 'May miss the strongest position-specific edge', 'Managers comfortable drafting the best available value'],
      },
    ],
  }
}

function improveBody(document) {
  const currentBody = document.body || []
  const oldComparisonIndex = currentBody.findIndex(
    (block) => block?._type === 'dataTable' && block?.columns?.[0] === 'Strategy',
  )
  if (oldComparisonIndex === -1 && !currentBody.some((block) => block?._key === 'hero-rb-strategy-comparison')) {
    throw new Error('Expected strategy comparison table was not found')
  }

  let body = currentBody.filter((_, index) => index !== oldComparisonIndex)

  body = body.map((block) => {
    const text = normalizedText(blockText(block))
    if (block?._key !== 'hero-rb-related-resources' && !text.includes('broader overview of roster construction')) {
      return block
    }
    return linkedBlock('hero-rb-related-resources', [
      {text: 'Next: Read The Snap\'s '},
      {text: 'complete fantasy draft strategy guide', href: '/articles/best-fantasy-football-draft-strategy'},
      {text: ', then test different Hero RB starts in the '},
      {text: 'mock draft simulator', href: '/fantasy/mock-draft-simulator'},
      {text: '.'},
    ])
  })

  body = insertBeforeHeading(body, 'Why fantasy players use Hero RB', roundByRoundBlocks())
  body = insertBeforeHeading(body, 'Where Hero RB works best', anchorBackBlocks())
  body = insertBeforeHeading(body, 'When to avoid Hero RB', [comparisonTable()])
  body = insertAfterHeading(body, 'FAQ', [
    textBlock('hero-rb-faq-round-heading', 'Which round should you draft your Hero RB?', 'h3'),
    textBlock(
      'hero-rb-faq-round-answer',
      'Most Hero RB builds select the anchor in Round 1 or Round 2. The correct cutoff depends on league size, scoring and the players available; the strategy should be abandoned if no back with a true anchor profile is worth the price.',
    ),
    textBlock('hero-rb-faq-round-three-heading', 'Should you take a running back in Round 3 with Hero RB?', 'h3'),
    textBlock(
      'hero-rb-faq-round-three-answer',
      'Usually not by design. Round 3 is commonly used on a wide receiver or another premium-position value. Take RB2 there only when the value is clearly better than the alternatives.',
    ),
  ])

  return body
}

function bodyCharacters(body) {
  return body.map(blockText).filter(Boolean).join('\n').length
}

function bodyHeadings(body) {
  return body
    .filter((block) => ['h2', 'h3'].includes(block?.style))
    .map((block) => ({style: block.style, text: blockText(block)}))
}

async function main() {
  const ids = [articleId, `drafts.${articleId}`]
  const documents = await client.fetch(
    `*[_id in $ids]{_id,_rev,_type,title,homepageTitle,slug,published,dateModified,summary,seo,body}`,
    {ids},
  )
  const draft = documents.find((document) => document._id.startsWith('drafts.'))
  if (draft) throw new Error(`A Studio draft exists for ${articleSlug}; refusing to overwrite it`)

  const document = documents.find((candidate) => candidate._id === articleId)
  if (!document || document._type !== 'article' || document.slug?.current !== articleSlug || document.published !== true) {
    throw new Error('Hero RB article guard failed')
  }

  const body = improveBody(document)
  const updatedAt = new Date().toISOString()
  const title = 'Hero RB Strategy: How It Works in Fantasy Football'
  const homepageTitle = 'Hero RB Strategy Explained'
  const summary = 'Hero RB is a fantasy football strategy that pairs one early anchor running back with premium picks at other positions. Use this round-by-round plan to build it correctly.'
  const metaDescription = 'Learn how the Hero RB fantasy football strategy works, when to draft your anchor back, what to do in Round 3 and how to build running back depth.'
  const seo = {
    _type: 'seo',
    autoGenerate: false,
    metaTitle: 'Hero RB Strategy: Round-by-Round Draft Plan | The Snap',
    metaDescription,
    focusKeyword: 'Hero RB strategy',
    additionalKeywords: [
      'Hero RB fantasy football',
      'Hero RB draft strategy',
      'Hero RB Round 3',
      'Hero RB vs Zero RB',
      'anchor RB strategy',
    ],
    ogTitle: 'Hero RB Strategy: A Practical Round-by-Round Draft Plan',
    ogDescription: metaDescription,
    noIndex: false,
  }

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    id: document._id,
    url: `https://thegamesnap.com/articles/${articleSlug}`,
    previousTitle: document.title,
    title,
    homepageTitle,
    previousBodyBlocks: document.body?.length || 0,
    bodyBlocks: body.length,
    previousBodyCharacters: bodyCharacters(document.body || []),
    bodyCharacters: bodyCharacters(body),
    metaTitle: seo.metaTitle,
    metaTitleLength: seo.metaTitle.length,
    metaDescriptionLength: seo.metaDescription.length,
    dateModified: updatedAt,
    headings: bodyHeadings(body),
  }, null, 2))

  if (!applyChanges) {
    console.log('\nDry run only. Re-run with --apply to commit this guarded patch.')
    return
  }

  await client
    .patch(document._id)
    .ifRevisionId(document._rev)
    .set({title, homepageTitle, summary, body, seo, dateModified: updatedAt})
    .commit({autoGenerateArrayKeys: true})

  console.log(`\nHero RB guide improvements committed at ${updatedAt}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

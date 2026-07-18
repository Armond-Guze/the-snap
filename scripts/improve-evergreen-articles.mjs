#!/usr/bin/env node

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const applyChanges = process.argv.includes('--apply')

const articleConfig = {
  salary: {
    id: '9e6c47e5-5e53-47aa-90f2-d4b123ed65fc',
    slug: 'how-does-the-nfl-salary-cap-work',
    metaTitle: 'How the NFL Salary Cap Works: Complete Guide | The Snap',
    metaDescription: 'Learn how the NFL salary cap works, including cap space, dead money, signing bonuses, restructures, rollover rules and common contract terms.',
    focusKeyword: 'how does the NFL salary cap work',
    additionalKeywords: [
      'NFL salary cap explained',
      'what is NFL cap space',
      'NFL dead cap',
      'NFL contract restructures',
      'NFL signing bonus cap hit',
    ],
  },
  franchise: {
    id: 'f2c49920-1440-4d3e-bec6-9c12668af457',
    slug: 'what-is-the-nfl-franchise-tag-and-how-does-it-work',
    metaTitle: 'What Is the NFL Franchise Tag? Rules & Types | The Snap',
    metaDescription: 'Learn how the NFL franchise tag works, including exclusive, non-exclusive and transition tags, salary calculations, deadlines and player options.',
    focusKeyword: 'what is the NFL franchise tag',
    additionalKeywords: [
      'franchise tag NFL',
      'how does the franchise tag work',
      'exclusive franchise tag',
      'non-exclusive franchise tag',
      'NFL transition tag',
    ],
  },
}

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

function textBlock(key, text, style = 'normal') {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-text`, marks: [], text}],
  }
}

function linkedBlock(key, segments) {
  const markDefs = segments
    .filter((segment) => segment.href)
    .map((segment, index) => ({
      _type: 'link',
      _key: `${key}-link-${index}`,
      href: segment.href,
    }))

  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs,
    children: segments.map((segment, index) => ({
      _type: 'span',
      _key: `${key}-span-${index}`,
      marks: segment.href ? [`${key}-link-${index}`] : [],
      text: segment.text,
    })),
  }
}

function renameHeading(block, from, to) {
  if (!['h2', 'h3'].includes(block?.style) || normalizedText(blockText(block)) !== normalizedText(from)) {
    return block
  }
  return textBlock(block._key, to, block.style)
}

function insertBeforeHeading(body, matcher, blocks) {
  if (blocks.every((block) => body.some((existing) => existing?._key === block._key))) return body
  const index = body.findIndex(
    (block) => ['h2', 'h3'].includes(block?.style) && matcher(blockText(block)),
  )
  if (index === -1) throw new Error('Required insertion heading was not found')
  return [...body.slice(0, index), ...blocks, ...body.slice(index)]
}

function buildSeo(document, config) {
  const {lastGenerated: _lastGenerated, ...existingSeo} = document.seo || {}
  return {
    ...existingSeo,
    autoGenerate: false,
    metaTitle: config.metaTitle,
    metaDescription: config.metaDescription,
    ogTitle: config.metaTitle,
    ogDescription: config.metaDescription,
    focusKeyword: config.focusKeyword,
    additionalKeywords: config.additionalKeywords,
    noIndex: false,
  }
}

function improveSalary(document) {
  let body = (document.body || []).map((block) =>
    renameHeading(renameHeading(block, 'FAQ', 'NFL Salary Cap FAQ'), 'Key Terms', 'Key NFL Salary Cap Terms'),
  )

  const sourceBlock = linkedBlock('evergreen-salary-official-sources', [
    {text: 'Official references: '},
    {text: 'NFL Football Operations’ salary cap overview', href: 'https://operations.nfl.com/calendar-events/nfl-free-agency/nfl-salary-cap'},
    {text: ' and '},
    {text: 'contract language guide', href: 'https://operations.nfl.com/calendar-events/nfl-free-agency/contract-language'},
    {text: ' explain the league rules and terminology behind these examples.'},
  ])
  body = insertBeforeHeading(body, (heading) => normalizedText(heading).includes('salary cap faq'), [sourceBlock])

  return {
    body,
    seo: buildSeo(document, articleConfig.salary),
  }
}

function franchiseFaqBlocks() {
  return [
    textBlock('evergreen-franchise-faq', 'NFL Franchise Tag FAQ', 'h2'),
    textBlock('evergreen-franchise-faq-q1', 'What does it mean to franchise tag a player?', 'h3'),
    textBlock('evergreen-franchise-faq-a1', 'It means the team offers one eligible pending unrestricted free agent a one-year tender calculated under the collective bargaining agreement. The tender gives the club additional control while the sides can continue negotiating a longer contract.'),
    textBlock('evergreen-franchise-faq-q2', 'Can a franchise-tagged player negotiate with other teams?', 'h3'),
    textBlock('evergreen-franchise-faq-a2', 'It depends on the tag. A player with a non-exclusive tag can negotiate with other teams, while the original team has matching rights and may receive draft-pick compensation. An exclusive tag prevents outside negotiations.'),
    textBlock('evergreen-franchise-faq-q3', 'How many franchise tags can an NFL team use?', 'h3'),
    textBlock('evergreen-franchise-faq-a3', 'A team can use only one franchise or transition tag in a league year, so clubs generally reserve it for their most important eligible free agent.'),
    textBlock('evergreen-franchise-faq-q4', 'Is the franchise tag a one-year contract?', 'h3'),
    textBlock('evergreen-franchise-faq-a4', 'Yes. Once the player signs the tender, it becomes a one-year contract. The team and player can still agree to a multiyear deal before the league’s applicable deadline.'),
    linkedBlock('evergreen-franchise-official-source', [
      {text: 'Official reference: '},
      {text: 'NFL Football Operations’ franchise tag guide', href: 'https://operations.nfl.com/calendar-events/nfl-free-agency/franchise-tags'},
      {text: ' provides the league definitions for exclusive, non-exclusive and transition tags.'},
    ]),
    linkedBlock('evergreen-franchise-related-guide', [
      {text: 'Related: Learn '},
      {text: 'how the NFL salary cap works', href: '/articles/how-does-the-nfl-salary-cap-work'},
      {text: ' and why the tag amount matters to a team’s cap space.'},
    ]),
  ]
}

function improveFranchise(document) {
  let body = [...(document.body || [])]
  if (body.length && normalizedText(blockText(body[0])) === normalizedText(document.summary)) {
    body = body.slice(1)
  }
  body = insertBeforeHeading(
    body,
    (heading) => normalizedText(heading).includes('bottom line'),
    franchiseFaqBlocks(),
  )

  const summary = 'The NFL franchise tag is a one-year tender that lets a team retain one pending unrestricted free agent. Here is how each tag type, salary calculation and negotiation rule works.'
  return {
    summary,
    body,
    seo: buildSeo(document, articleConfig.franchise),
  }
}

async function main() {
  const ids = Object.values(articleConfig).map((config) => config.id)
  const drafts = await client.fetch(
    `*[_id in $draftIds]{_id}`,
    {draftIds: ids.map((id) => `drafts.${id}`)},
  )
  if (drafts.length) throw new Error(`Drafts exist for guarded articles: ${drafts.map((draft) => draft._id).join(', ')}`)

  const documents = await client.fetch(
    `*[_id in $ids]{_id,_rev,_type,title,summary,slug,body,seo,published}`,
    {ids},
  )
  if (documents.length !== ids.length) throw new Error(`Expected ${ids.length} articles, found ${documents.length}`)

  const byId = new Map(documents.map((document) => [document._id, document]))
  for (const config of Object.values(articleConfig)) {
    const document = byId.get(config.id)
    if (!document || document._type !== 'article' || document.slug?.current !== config.slug || document.published !== true) {
      throw new Error(`Guard failed for ${config.id}`)
    }
  }

  const salary = byId.get(articleConfig.salary.id)
  const franchise = byId.get(articleConfig.franchise.id)
  const salaryPatch = improveSalary(salary)
  const franchisePatch = improveFranchise(franchise)
  const updatedAt = new Date().toISOString()

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    updatedAt,
    salary: {
      id: salary._id,
      bodyBlocksBefore: salary.body?.length || 0,
      bodyBlocksAfter: salaryPatch.body.length,
      metaTitle: salaryPatch.seo.metaTitle,
      metaTitleLength: salaryPatch.seo.metaTitle.length,
      metaDescriptionLength: salaryPatch.seo.metaDescription.length,
      focusKeyword: salaryPatch.seo.focusKeyword,
    },
    franchise: {
      id: franchise._id,
      bodyBlocksBefore: franchise.body?.length || 0,
      bodyBlocksAfter: franchisePatch.body.length,
      removedDuplicateSummary: normalizedText(blockText(franchise.body?.[0])) === normalizedText(franchise.summary),
      metaTitle: franchisePatch.seo.metaTitle,
      metaTitleLength: franchisePatch.seo.metaTitle.length,
      metaDescriptionLength: franchisePatch.seo.metaDescription.length,
      focusKeyword: franchisePatch.seo.focusKeyword,
    },
  }, null, 2))

  if (!applyChanges) {
    console.log('\nDry run only. Re-run with --apply to commit this guarded transaction.')
    return
  }

  const transaction = client
    .transaction()
    .patch(salary._id, (patch) => patch.ifRevisionId(salary._rev).set({...salaryPatch, dateModified: updatedAt}))
    .patch(franchise._id, (patch) => patch.ifRevisionId(franchise._rev).set({...franchisePatch, dateModified: updatedAt}))

  await transaction.commit({autoGenerateArrayKeys: true})
  console.log(`\nEvergreen article improvements committed at ${updatedAt}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

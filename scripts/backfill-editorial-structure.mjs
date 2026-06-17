#!/usr/bin/env node
// Backfill editorial structure across published canonical content.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-editorial-structure.mjs
//   node scripts/backfill-editorial-structure.mjs --write

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
const CONTENT_TYPES = ['article', 'rankings']
const MAX_TAG_REFS = 6
const MAX_TOPIC_HUBS = 3

if (!projectId || !dataset) {
  console.error('Missing Sanity projectId/dataset in env')
  process.exit(1)
}

if (WRITE && !token) {
  console.error('Missing Sanity write token. Set SANITY_WRITE_TOKEN or run without --write.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

const TAG_RULES = [
  { slug: 'nfl', pattern: /\bnfl\b|\bfootball\b|\bchiefs\b|\bcowboys\b|\beagles\b|\bgiants\b|\bbills\b|\bdolphins\b|\bpackers\b|\bchargers\b|\b49ers\b|\bravens\b|\bbengals\b|\bbrowns\b|\btexans\b|\bcolts\b|\bbuccaneers\b|\blions\b|\bseahawks\b|\bpatriots\b|\bcommanders\b|\bjets\b|\bvikings\b|\bbears\b|\bfalcons\b/i },
  { slug: 'quarterbacks', pattern: /\bquarterbacks?\b|\bqb\b|\bJaxson Dart\b|\bShedeur Sanders\b|\bDaniel Jones\b|\bJordan Love\b|\bDrake Maye\b|\bMac Jones\b|\bJayden Daniels\b|\bCaleb Williams\b|\bCam Ward\b/i },
  { slug: 'qb-watch', pattern: /\bquarterbacks?\b|\bqb\b|\bstarter\b|\bstarting qb\b|\bJaxson Dart\b|\bShedeur Sanders\b|\bDaniel Jones\b|\bJordan Love\b|\bDrake Maye\b|\bMac Jones\b|\bJayden Daniels\b|\bCaleb Williams\b|\bCam Ward\b/i },
  { slug: 'injury-report', pattern: /\binjur(y|ies|ed)\b|\bankle\b|\bcalf\b|\bknee\b|\bshoulder\b|\boblique\b|\bsurgery\b|\bsprain\b|\bstrain\b|\bpup\b|\bhamstring\b|\bconcussion\b/i },
  { slug: 'nfl-suspensions', pattern: /\bsuspension\b|\bsuspended\b|\bdiscipline\b/i },
  { slug: 'player-discipline', pattern: /\bsuspension\b|\bsuspended\b|\bbenched\b|\bcourt date\b|\bleague review\b|\bdiscipline\b/i },
  { slug: 'roster-moves', pattern: /\bwaiv(e|ing|ed)\b|\bactivate\b|\bacquir(e|ing|ed)\b|\bsign(s|ed|ing)?\b|\brelease\b|\bretire\b|\btrade(d|s|ing)?\b|\bextension\b|\bcontract\b|\broster\b/i },
  { slug: 'nfl-offseason-moves', pattern: /\boffseason\b|\bwaiv(e|ing|ed)\b|\bacquir(e|ing|ed)\b|\bsign(s|ed|ing)?\b|\brelease\b|\bretire\b|\btrade(d|s|ing)?\b|\bextension\b|\bcontract\b|\broster\b/i },
  { slug: 'trade-rumors', pattern: /\btrade\b|\btraded\b|\btrading\b|\btrade offers?\b|\bdeadline deals?\b/i },
  { slug: 'nfl-free-agency', pattern: /\bfree agenc(y|ies)\b|\bfree agents?\b|\bcontract\b|\bextension\b|\bsign(s|ed|ing)?\b|\bcap\b/i },
  { slug: 'rookie-contracts', pattern: /\brookie contract\b|\brookie deal\b/i },
  { slug: 'rookie-rankings', pattern: /\brookies?\b|\bfirst-year\b|\bdebut\b/i },
  { slug: 'preseason', pattern: /\bpreseason\b|\bjoint practice\b|\bpractice\b|\bdebut\b|\bpup\b|\bweek 1\b|\bhall of fame game\b/i },
  { slug: 'training-camp', pattern: /\btraining camp\b|\bcamp\b|\bjoint practice\b|\bpractice\b|\botas\b|\bmandatory minicamp\b/i },
  { slug: 'thursday-night-football', pattern: /\bthursday night football\b|\btnf\b/i },
  { slug: 'primetime-games', pattern: /\bprimetime\b|\bthursday night football\b|\bmonday night football\b|\bsunday night football\b|\btnf\b|\bmnf\b|\bsnf\b/i },
  { slug: 'season-opener', pattern: /\bseason opener\b|\bopener\b|\bkickoff game\b|\bcowboys vs eagles\b|\bcowboys-vs-eagles\b/i },
  { slug: 'nfl-kickoff-game', pattern: /\bkickoff game\b|\bseason opener\b|\bcowboys vs eagles\b|\bcowboys-vs-eagles\b/i },
  { slug: 'team-rankings', pattern: /\branking all\b|\bteam rankings?\b|\bpower rankings?\b|\bmost surprising teams\b|\bdivisions?\b|\btop 10 nfl offenses\b/i },
  { slug: 'offensive-rankings', pattern: /\boffenses?\b|\boffensive rankings?\b/i },
  { slug: 'power-rankings', pattern: /\bpower rankings?\b/i },
  { slug: 'player-rankings', pattern: /\btop\s+\d+\b|\brankings?\b|\bplayers?\b|\brookies?\b|\bjerseys?\b/i },
  { slug: 'nfl-playoffs', pattern: /\bplayoffs?\b|\bpostseason\b|\bwild card\b|\bdivisional round\b|\bconference championship\b/i },
  { slug: 'super-bowl', pattern: /\bsuper bowl\b|\bsuperbowl\b/i },
  { slug: 'fantasy-football', pattern: /\bfantasy\b/i },
  { slug: 'fantasy-strategy', pattern: /\bfantasy\b.{0,120}\b(strategy|draft|sleeper|waiver|lineup|start|sit)\b/i },
  { slug: 'fantasy-rankings', pattern: /\bfantasy\b.{0,120}\brankings?\b|\btop\s+\d+\s+fantasy\b/i },
  { slug: 'nfl-betting', pattern: /\bbetting\b|\bodds\b|\bspread\b|\bmoneyline\b|\bfutures?\b|\bwin totals?\b/i },
  { slug: 'betting-odds', pattern: /\bodds\b|\bspread\b|\bmoneyline\b|\bfutures?\b|\bwin totals?\b/i },
  { slug: 'nfl-draft', pattern: /\bnfl draft\b|\bdraft\b|\bmock draft\b|\bfirst-round\b|\bprospects?\b|\brookies?\b/i },
]

const HUB_RULES = [
  { slug: 'fantasy-football', pattern: /\bfantasy\b/i },
  { slug: 'draft', pattern: /\bnfl draft\b|\bdraft\b|\bmock draft\b|\bprospects?\b|\brookies?\b/i },
  { slug: 'nfl-free-agency', pattern: /\bfree agenc(y|ies)\b|\bcontract\b|\bextension\b|\bsign(s|ed|ing)?\b|\bcap\b/i },
  { slug: 'nfl-trade-deadline', pattern: /\btrade deadline\b|\bdeadline deals?\b/i },
  { slug: 'nfl-offseason', pattern: /\boffseason\b|\btrade\b|\btraded\b|\btrading\b|\bwaiv(e|ing|ed)\b|\bacquir(e|ing|ed)\b|\bsign(s|ed|ing)?\b|\brelease\b|\bretire\b|\bcontract\b|\bextension\b/i },
  { slug: 'nfl-preseason', pattern: /\bpreseason\b|\bjoint practice\b|\bpractice\b|\bdebut\b|\bpup\b|\bweek 1\b|\bhall of fame game\b/i },
  { slug: 'nfl-training-camp', pattern: /\btraining camp\b|\bcamp\b|\bjoint practice\b|\botas\b|\bmandatory minicamp\b/i },
  { slug: 'nfl-playoffs', pattern: /\bplayoffs?\b|\bpostseason\b|\bwild card\b|\bdivisional round\b|\bconference championship\b/i },
  { slug: 'super-bowl', pattern: /\bsuper bowl\b|\bsuperbowl\b/i },
  { slug: 'nfl-power-rankings', pattern: /\bpower rankings?\b|\bteam rankings?\b|\branking all\b|\btop 10 nfl offenses\b|\bmost surprising teams\b/i },
  { slug: 'nfl-betting', pattern: /\bbetting\b|\bodds\b|\bspread\b|\bmoneyline\b|\bfutures?\b|\bwin totals?\b/i },
  { slug: 'nfl-regular-season', pattern: /\bwhat we learned\b|\bvs\b|\bgame\b|\bstarter\b|\bstarting\b|\bseason\b|\bweek\b|\bchiefs\b|\bcowboys\b|\beagles\b|\bgiants\b|\bbills\b|\bdolphins\b|\bpackers\b|\bchargers\b|\b49ers\b|\bravens\b|\bbengals\b|\bbrowns\b|\btexans\b|\bcolts\b|\bbuccaneers\b|\blions\b|\bseahawks\b|\bpatriots\b|\bcommanders\b|\bjets\b|\bvikings\b|\bbears\b|\bfalcons\b/i },
]

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function key() {
  return Math.random().toString(36).slice(2, 14)
}

function blockText(block) {
  return compact((block?.children || []).map((child) => child?.text || '').join(' '))
}

function docText(doc) {
  return [
    doc.title,
    doc.homepageTitle,
    doc.summary,
    doc.category?.title,
    doc.category?.slug,
    doc.format,
    doc.rankingType,
    ...(doc.teams || []).map((team) => team?.title || team?.teamName || ''),
    ...(doc.rankings || []).map((entry) => entry?.teamName || entry?.team?.title || ''),
    ...(doc.body || []).map(blockText),
    ...(doc.content || []).map(blockText),
  ]
    .map(compact)
    .filter(Boolean)
    .join(' ')
}

function ref(id) {
  return { _type: 'reference', _ref: id }
}

function uniqueRefs(refs) {
  const seen = new Set()
  const next = []
  for (const item of refs || []) {
    const id = item?._ref || item
    if (!id || seen.has(id)) continue
    seen.add(id)
    next.push(ref(id))
  }
  return next
}

function sameRefIds(a, b) {
  const left = (a || []).map((item) => item?._ref).filter(Boolean).join('|')
  const right = (b || []).map((item) => item?._ref).filter(Boolean).join('|')
  return left === right
}

function textBlock(text, style = 'normal') {
  return {
    _type: 'block',
    _key: key(),
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  }
}

function firstBodyField(doc) {
  if (Array.isArray(doc.body)) return 'body'
  if (Array.isArray(doc.content)) return 'content'
  return null
}

function hasH2(blocks) {
  return (blocks || []).some((block) => block?._type === 'block' && block.style === 'h2')
}

function looksLikePlainHeading(block, doc) {
  if (block?._type !== 'block' || block.style !== 'normal') return false
  const text = blockText(block)
  if (text.length < 4 || text.length > 90) return false
  if (/[.!?]$/.test(text)) return false
  if (/^(by|from|source):?\b/i.test(text)) return false
  if (compact(doc.title).toLowerCase() === text.toLowerCase()) return false
  return true
}

function inferH2(doc) {
  const text = docText(doc)
  if (/\bwhat we learned\b/i.test(text)) return 'What stood out'
  if (/\binjur(y|ies|ed)\b|\bcalf\b|\bankle\b|\bknee\b|\bshoulder\b|\boblique\b|\bsurgery\b/i.test(text)) return 'What it means'
  if (/\btrade\b|\bwaiv(e|ing|ed)\b|\bacquir(e|ing|ed)\b|\broster\b/i.test(text)) return 'Roster impact'
  if (/\bcontract\b|\bextension\b|\bsign(s|ed|ing)?\b/i.test(text)) return 'Contract impact'
  if (/\bquarterbacks?\b|\bqb\b|\bstarter\b|\bstarting\b/i.test(text)) return 'Quarterback impact'
  if (/\bfantasy\b/i.test(text)) return 'Fantasy football outlook'
  if (/\bdraft\b|\brookies?\b/i.test(text)) return 'Draft context'
  if (/\bbetting\b|\bodds\b|\bspread\b|\bmoneyline\b|\bfutures?\b/i.test(text)) return 'Betting context'
  if (/\branking\b|\brankings\b|\btop\s+\d+\b/i.test(text)) return 'Ranking context'
  if (/\bvs\b|\bgame\b|\bmatchup\b|\bweek\b/i.test(text)) return 'Game context'
  return 'Why it matters'
}

function addH2Structure(doc) {
  const field = firstBodyField(doc)
  if (!field) return null
  const blocks = doc[field]
  if (!Array.isArray(blocks) || hasH2(blocks)) return null

  const textLength = compact(blocks.map(blockText).join(' ')).length
  if (textLength < 650) return null

  const firstTextIndex = blocks.findIndex((block) => block?._type === 'block' && blockText(block).length > 0)
  if (firstTextIndex < 0) return null

  const nextBlocks = [...blocks]
  if (looksLikePlainHeading(nextBlocks[firstTextIndex], doc)) {
    nextBlocks[firstTextIndex] = { ...nextBlocks[firstTextIndex], style: 'h2' }
    return { field, blocks: nextBlocks, reason: 'convert existing heading paragraph to H2' }
  }

  nextBlocks.splice(firstTextIndex + 1, 0, textBlock(inferH2(doc), 'h2'))
  return { field, blocks: nextBlocks, reason: 'insert H2 structure' }
}

function inferTagIds(doc, tagBySlug) {
  const text = docText(doc)
  const ids = []
  for (const rule of TAG_RULES) {
    const tag = tagBySlug.get(rule.slug)
    if (tag && rule.pattern.test(text)) ids.push(tag._id)
  }
  return ids
}

function inferHubIds(doc, hubBySlug) {
  const text = docText(doc)
  const ids = []
  for (const rule of HUB_RULES) {
    const hub = hubBySlug.get(rule.slug)
    if (hub && rule.pattern.test(text)) ids.push(hub._id)
  }
  return ids
}

function addFallbackTagIds(doc, tagBySlug, ids) {
  const text = docText(doc)
  const add = (slug) => {
    const tag = tagBySlug.get(slug)
    if (tag) ids.push(tag._id)
  }

  if (doc._type === 'rankings' || doc.format === 'ranking') add('team-rankings')
  if (/\boffenses?\b/i.test(text)) add('offensive-rankings')
  if (/\bdefense|defensive\b/i.test(text)) add('defensive-rankings')
  if (/\bsurprising teams?\b/i.test(text)) add('team-rankings')
  if (/\btop\s+\d+\b/i.test(text)) add('player-rankings')
  add('nfl')
}

function addFallbackHubIds(doc, hubBySlug, ids) {
  const text = docText(doc)
  const add = (slug) => {
    const hub = hubBySlug.get(slug)
    if (hub) ids.push(hub._id)
  }

  if (doc._type === 'rankings' || doc.format === 'ranking' || /\branking|rankings|top 10 nfl offenses|surprising teams/i.test(text)) {
    add('nfl-power-rankings')
    return
  }

  if (/contract|extension|sign|trade|waiv|release|retire|roster/i.test(text)) add('nfl-offseason')
  if (/injur|preseason|practice|pup|week 1|debut/i.test(text)) add('nfl-preseason')
  if (/fantasy/i.test(text)) add('fantasy-football')
  if (/draft|rookie/i.test(text)) add('draft')
  if (/playoff|postseason/i.test(text)) add('nfl-playoffs')
  if (/super bowl|superbowl/i.test(text)) add('super-bowl')
  add('nfl-regular-season')
}

function buildTaxonomyPatch(doc, indexes) {
  const set = {}
  const reasons = []
  const existingTagRefs = uniqueRefs(doc.tagRefs || [])
  if (existingTagRefs.length < 3) {
    const inferredTagIds = inferTagIds(doc, indexes.tagBySlug)
    addFallbackTagIds(doc, indexes.tagBySlug, inferredTagIds)
    const nextTagRefs = uniqueRefs([...existingTagRefs, ...inferredTagIds]).slice(0, MAX_TAG_REFS)

    if (!sameRefIds(existingTagRefs, nextTagRefs)) {
      set.tagRefs = nextTagRefs
      reasons.push(existingTagRefs.length ? 'fill sparse tagRefs' : 'add tagRefs')
    }
  }

  const existingHubs = uniqueRefs(doc.topicHubs || [])
  if (existingHubs.length === 0) {
    const inferredHubIds = inferHubIds(doc, indexes.hubBySlug)
    addFallbackHubIds(doc, indexes.hubBySlug, inferredHubIds)
    const nextHubs = uniqueRefs([...existingHubs, ...inferredHubIds]).slice(0, MAX_TOPIC_HUBS)

    if (!sameRefIds(existingHubs, nextHubs)) {
      set.topicHubs = nextHubs
      reasons.push('add topicHubs')
    }
  }

  return { set, reasons }
}

function rankingBody(doc) {
  const summary = compact(doc.summary) || `${doc.title} looks at the teams, units, and context shaping the 2025 NFL outlook.`
  return [
    textBlock('Ranking overview', 'h2'),
    textBlock(summary),
    textBlock('How to read this ranking', 'h2'),
    textBlock('This ranking weighs the context already reflected in each entry, including roster strength, quarterback play, coaching stability, recent performance, and the path each team or division has to outperform expectations.'),
  ]
}

function buildRankingStructurePatch(doc) {
  const set = {}
  const reasons = []

  if (doc._type === 'rankings' && !Array.isArray(doc.body)) {
    set.body = rankingBody(doc)
    reasons.push('add legacy ranking body scaffold')
  }

  if (doc._type === 'article' && doc.format === 'powerRankings') {
    if (!Array.isArray(doc.rankingIntro) || doc.rankingIntro.length === 0) {
      set.rankingIntro = [
        textBlock('Super Bowl power rankings snapshot', 'h2'),
        textBlock('The Super Bowl snapshot closes the season by separating the teams that proved their ceiling from the teams still chasing answers. These rankings weigh postseason performance, roster direction, quarterback stability, and how each contender looks heading into the next NFL cycle.'),
      ]
      reasons.push('add power rankings intro')
    } else if (!hasH2(doc.rankingIntro)) {
      set.rankingIntro = [textBlock('Super Bowl power rankings snapshot', 'h2'), ...doc.rankingIntro]
      reasons.push('add H2 to power rankings intro')
    }
    if (!Array.isArray(doc.rankingConclusion) || doc.rankingConclusion.length === 0) {
      set.rankingConclusion = [
        textBlock('Final takeaway', 'h2'),
        textBlock('The final board is less about one game than the full shape of the season. Seattle finished on top, but the teams beneath the champion still have clear paths to climb if they solve their biggest offseason questions.'),
      ]
      reasons.push('add power rankings conclusion')
    }
  }

  return { set, reasons }
}

function buildPatch(doc, indexes) {
  const set = {}
  const reasons = []
  const taxonomy = buildTaxonomyPatch(doc, indexes)
  Object.assign(set, taxonomy.set)
  reasons.push(...taxonomy.reasons)

  const h2 = addH2Structure(doc)
  if (h2) {
    set[h2.field] = h2.blocks
    reasons.push(h2.reason)
  }

  const rankingStructure = buildRankingStructurePatch(doc)
  Object.assign(set, rankingStructure.set)
  reasons.push(...rankingStructure.reasons)

  return reasons.length ? { set, reasons } : null
}

async function fetchIndexes() {
  const [tags, hubs] = await Promise.all([
    client.fetch(`*[_type == "advancedTag" && defined(slug.current)]{_id,title,"slug":slug.current}`),
    client.fetch(`*[_type == "topicHub" && defined(slug.current) && coalesce(active, true) == true && !(_id in path("drafts.**"))]{_id,title,"slug":slug.current}`),
  ])

  return {
    tagBySlug: new Map(tags.map((tag) => [tag.slug, tag])),
    hubBySlug: new Map(hubs.map((hub) => [hub.slug, hub])),
  }
}

async function fetchDocs() {
  return client.fetch(
    `*[
      _type in $types &&
      published == true &&
      defined(slug.current) &&
      !(_id in path("drafts.**")) &&
      (!defined(seo.noIndex) || seo.noIndex == false)
    ]{
      _id,
      _type,
      format,
      rankingType,
      title,
      homepageTitle,
      summary,
      "slug": slug.current,
      category->{title,"slug":slug.current},
      tagRefs[]{_type,_ref},
      teams[]{_type,_ref,title,"slug":slug.current,teamName},
      topicHubs[]{_type,_ref},
      body[]{..., children[]{...}},
      content[]{..., children[]{...}},
      rankingIntro[]{..., children[]{...}},
      rankingConclusion[]{..., children[]{...}},
      rankings[]{rank,teamName,team->{title}}
    } | order(coalesce(date, publishedAt, _createdAt) desc)`,
    { types: CONTENT_TYPES }
  )
}

async function main() {
  console.log(`Starting editorial structure backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)
  const [indexes, docs] = await Promise.all([fetchIndexes(), fetchDocs()])
  let changed = 0
  let skipped = 0

  for (const doc of docs) {
    const patch = buildPatch(doc, indexes)
    if (!patch) {
      skipped++
      continue
    }

    changed++
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${doc._type}${doc.format ? `/${doc.format}` : ''} ${doc.slug}`)
    console.log(`  ${doc.title}`)
    console.log(`  reasons: ${patch.reasons.join(', ')}`)

    if (!DRY_RUN) {
      await client.patch(doc._id).set(patch.set).commit({ autoGenerateArrayKeys: true })
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped.`)
  if (DRY_RUN && token) console.log('Run again with --write to apply editorial structure updates.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

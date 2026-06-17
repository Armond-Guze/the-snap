#!/usr/bin/env node
// Backfill conservative indexing basics across published content.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-indexing-basics.mjs
//   node scripts/backfill-indexing-basics.mjs --write

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

const TEAM_NAMES = [
  'Arizona Cardinals',
  'Atlanta Falcons',
  'Baltimore Ravens',
  'Buffalo Bills',
  'Carolina Panthers',
  'Chicago Bears',
  'Cincinnati Bengals',
  'Cleveland Browns',
  'Dallas Cowboys',
  'Denver Broncos',
  'Detroit Lions',
  'Green Bay Packers',
  'Houston Texans',
  'Indianapolis Colts',
  'Jacksonville Jaguars',
  'Kansas City Chiefs',
  'Las Vegas Raiders',
  'Los Angeles Chargers',
  'Los Angeles Rams',
  'Miami Dolphins',
  'Minnesota Vikings',
  'New England Patriots',
  'New Orleans Saints',
  'New York Giants',
  'New York Jets',
  'Philadelphia Eagles',
  'Pittsburgh Steelers',
  'San Francisco 49ers',
  'Seattle Seahawks',
  'Tampa Bay Buccaneers',
  'Tennessee Titans',
  'Washington Commanders',
]

const TEAM_ALIASES = {
  'Arizona Cardinals': ['Cardinals'],
  'Atlanta Falcons': ['Falcons'],
  'Baltimore Ravens': ['Ravens'],
  'Buffalo Bills': ['Bills'],
  'Carolina Panthers': ['Panthers'],
  'Chicago Bears': ['Bears'],
  'Cincinnati Bengals': ['Bengals'],
  'Cleveland Browns': ['Browns'],
  'Dallas Cowboys': ['Cowboys'],
  'Denver Broncos': ['Broncos'],
  'Detroit Lions': ['Lions'],
  'Green Bay Packers': ['Packers'],
  'Houston Texans': ['Texans'],
  'Indianapolis Colts': ['Colts'],
  'Jacksonville Jaguars': ['Jaguars', 'Jags'],
  'Kansas City Chiefs': ['Chiefs'],
  'Las Vegas Raiders': ['Raiders'],
  'Los Angeles Chargers': ['LA Chargers', 'Chargers'],
  'Los Angeles Rams': ['LA Rams', 'Rams'],
  'Miami Dolphins': ['Dolphins'],
  'Minnesota Vikings': ['Vikings'],
  'New England Patriots': ['Patriots', 'Pats'],
  'New Orleans Saints': ['Saints'],
  'New York Giants': ['NY Giants', 'Giants'],
  'New York Jets': ['NY Jets', 'Jets'],
  'Philadelphia Eagles': ['Eagles'],
  'Pittsburgh Steelers': ['Steelers'],
  'San Francisco 49ers': ['49ers', 'Niners'],
  'Seattle Seahawks': ['Seahawks'],
  'Tampa Bay Buccaneers': ['Buccaneers', 'Bucs'],
  'Tennessee Titans': ['Titans'],
  'Washington Commanders': ['Commanders'],
}

const CATEGORY_BY_FORMAT = {
  fantasy: 'fantasy',
  fantasyFootball: 'fantasy',
  powerRankings: 'power-rankings',
  ranking: 'rankings',
  rankings: 'rankings',
  headline: 'headlines',
  feature: 'features',
  analysis: 'features',
}

const GENERIC_META_TITLES = new Set([
  'betting odds',
  'draft order',
  'fantasy football',
  'fantasy rankings',
  'free agent landing spots',
  'nfl betting',
  'nfl coaching cycle',
  'nfl draft',
  'nfl free agency',
  'nfl headlines',
  'nfl playoffs',
  'power rankings',
  'super bowl',
  'superbowl',
  'team rankings',
  'trade rumors',
])

const HUB_RULES = [
  { slug: 'fantasy-football', pattern: /\bfantasy\b/i },
  { slug: 'draft', pattern: /\bnfl draft\b|\bmock draft\b|\bdraft order\b|\bbig board\b|\bdraft grades?\b|\bround 1\b/i },
  { slug: 'nfl-free-agency', pattern: /\bfree agenc(y|ies)\b|\bfree agents?\b|\bfranchise tag\b|\bsalary cap\b|\bcap space\b|\bcontract\b/i },
  { slug: 'nfl-trade-deadline', pattern: /\btrade deadline\b|\bdeadline deals?\b/i },
  { slug: 'nfl-betting', pattern: /\bbetting\b|\bodds\b|\bwin totals?\b|\bover\/under\b|\bspread\b|\bmoneyline\b|\bfutures?\b/i },
  { slug: 'nfl-coaching-cycle', pattern: /\bcoach\b|\bcoordinator\b|\bfired\b|\bhired\b|\bhead coach search\b/i },
  { slug: 'nfl-playoffs', pattern: /\bplayoffs?\b|\bpostseason\b|\bwild card\b|\bdivisional round\b|\bconference championship\b/i },
  { slug: 'super-bowl', pattern: /\bsuper bowl\b/i },
  { slug: 'nfl-offseason', pattern: /\boffseason\b|\bfree agenc(y|ies)\b|\bnfl draft\b|\btrade\b|\bcontract\b|\bretire\b/i },
  { slug: 'nfl-preseason', pattern: /\bpreseason\b|\btraining camp\b|\broster cuts?\b|\bweek 1\b/i },
  { slug: 'nfl-training-camp', pattern: /\btraining camp\b|\botas\b|\bminicamp\b/i },
  { slug: 'nfl-power-rankings', pattern: /\bpower rankings?\b/i },
]

const TAG_RULES = [
  { slug: 'fantasy-football', pattern: /\bfantasy\b/i },
  { slug: 'fantasy-rankings', pattern: /\bfantasy\b.{0,80}\brankings?\b|\btop\s+\d+\s+fantasy\b/i },
  { slug: 'fantasy-strategy', pattern: /\bfantasy\b.{0,100}\b(strategy|draft|hero rb|zero rb|sleeper|waiver)\b/i },
  { slug: 'fantasy-draft-strategy', pattern: /\bfantasy\b.{0,100}\bdraft strategy\b|\bhero rb\b|\bzero rb\b|\brobust rb\b/i },
  { slug: 'nfl-draft', pattern: /\bnfl draft\b|\bdraft grades?\b|\bfirst-round\b|\bround 1\b|\bdraft prospects?\b/i },
  { slug: 'nfl-mock-draft', pattern: /\bmock draft\b/i },
  { slug: 'draft-order', pattern: /\bdraft order\b/i },
  { slug: 'draft-big-board', pattern: /\bbig board\b/i },
  { slug: 'draft-prospects', pattern: /\bprospects?\b|\bscouting report\b/i },
  { slug: 'nfl-free-agency', pattern: /\bfree agenc(y|ies)\b|\bfree agents?\b/i },
  { slug: 'nfl-offseason-moves', pattern: /\boffseason\b|\bcontract\b|\bextension\b|\brestructure\b|\bretire\b|\btrade\b|\brelease\b|\bsign(s|ed|ing)?\b/i },
  { slug: 'nfl-salary-cap', pattern: /\bsalary cap\b|\bcap space\b|\brestructure\b|\bdead money\b|\bguarantees?\b/i },
  { slug: 'trade-rumors', pattern: /\btrade\b|\btraded\b|\btrade rumors?\b|\btrade buzz\b/i },
  { slug: 'nfl-trade-deadline', pattern: /\btrade deadline\b|\bdeadline deals?\b/i },
  { slug: 'injury-report', pattern: /\binjur(y|ies|ed)\b|\bsurgery\b|\bcalf\b|\bknee\b|\bshoulder\b|\bsprain\b|\bhamstring\b|\bconcussion\b/i },
  { slug: 'nfl-coaching-cycle', pattern: /\bcoach\b|\bcoordinator\b|\bfired\b|\bhired\b|\binterview\b/i },
  { slug: 'head-coach-search', pattern: /\bhead coach search\b|\bhead coach\b|\bcoaching search\b/i },
  { slug: 'quarterbacks', pattern: /\bquarterbacks?\b|\bqb\b/i },
  { slug: 'primetime-games', pattern: /\bprimetime\b|\bthursday night football\b|\bmonday night football\b|\bsunday night football\b|\bTNF\b|\bMNF\b|\bSNF\b/i },
  { slug: 'nfl-playoffs', pattern: /\bplayoffs?\b|\bpostseason\b|\bwild card\b|\bdivisional round\b|\bconference championship\b/i },
  { slug: 'playoff-picture', pattern: /\bplayoff picture\b/i },
  { slug: 'super-bowl', pattern: /\bsuper bowl\b|\bsuperbowl\b/i },
  { slug: 'nfl-betting', pattern: /\bbetting\b|\bbest bets?\b|\bodds\b|\bspread\b|\bmoneyline\b|\bfutures?\b/i },
  { slug: 'betting-odds', pattern: /\bodds\b|\bspread\b|\bmoneyline\b|\bfutures?\b/i },
  { slug: 'win-totals', pattern: /\bwin totals?\b|\bover\/under\b/i },
  { slug: 'nfl-schedule-release', pattern: /\bschedule release\b|\bnfl schedule\b/i },
  { slug: 'strength-of-schedule', pattern: /\bstrength of schedule\b/i },
  { slug: 'power-rankings', pattern: /\bpower rankings?\b/i },
  { slug: 'team-rankings', pattern: /\branking all\b|\bteam rankings?\b|\bpower rankings?\b/i },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalize(value) {
  return compact(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function uniqueRefs(refs) {
  const seen = new Set()
  const next = []
  for (const ref of refs || []) {
    const id = ref?._ref || ref
    if (!id || seen.has(id)) continue
    seen.add(id)
    next.push({ _type: 'reference', _ref: id })
  }
  return next
}

function sameRefIds(a, b) {
  const left = (a || []).map((ref) => ref?._ref).filter(Boolean).join('|')
  const right = (b || []).map((ref) => ref?._ref).filter(Boolean).join('|')
  return left === right
}

function sameValue(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

function setIfChanged(set, doc, field, value) {
  if (value === undefined || sameValue(doc[field], value)) return false
  set[field] = value
  return true
}

function hasMeaningfulTitleOverlap(title, metaTitle) {
  const titleTerms = normalize(title)
    .split(' ')
    .filter((term) => term.length >= 5 && !['after', 'before', 'their', 'about', 'with', 'from', 'will'].includes(term))
  const meta = normalize(String(metaTitle || '').replace(/\|\s*the snap$/i, ''))
  if (!meta) return false
  return titleTerms.some((term) => meta.includes(term))
}

function isGenericMetaTitle(doc) {
  const metaTitle = compact(doc.seo?.metaTitle)
  if (!metaTitle) return true
  const unbranded = metaTitle.replace(/\|\s*the snap$/i, '').trim()
  if (GENERIC_META_TITLES.has(normalize(unbranded))) return true
  if (/^(nfl headlines?|headlines?|nfl coverage)$/i.test(unbranded)) return true
  if (unbranded.split(/\s+/).length <= 3 && !hasMeaningfulTitleOverlap(doc.title, metaTitle)) return true
  return false
}

function truncateWords(value, maxLength) {
  const input = compact(value)
  if (input.length <= maxLength) return input
  const slice = input.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 35 ? slice.slice(0, lastSpace) : slice).trim().replace(/[,:;/-]+$/, '')
}

function buildMetaTitle(title) {
  const cleanTitle = compact(title)
  const branded = `${cleanTitle} | The Snap`
  if (branded.length <= 60) return branded
  return `${truncateWords(cleanTitle, 49)} | The Snap`
}

function buildHomepageTitle(title) {
  return truncateWords(title, 65)
}

function buildMetaDescription(summary, title) {
  const cleanSummary = compact(summary)
  if (cleanSummary.length >= 90 && cleanSummary.length <= 155 && !cleanSummary.includes('...')) {
    return cleanSummary
  }
  if (cleanSummary.length >= 90) return truncateWords(cleanSummary, 155)
  return truncateWords(`${title}: NFL coverage from The Snap with the key context, impact, and next steps for fans.`, 155)
}

function docText(doc) {
  return [doc.title, doc.homepageTitle, doc.summary, doc.category?.title, doc.format, doc._type]
    .map(compact)
    .filter(Boolean)
    .join(' ')
}

function detectTeamRefs(doc, teamDocs) {
  if (!['article', 'headline'].includes(doc._type)) return []
  const text = ` ${normalize(docText(doc))} `
  const refs = []

  for (const team of teamDocs) {
    const aliases = [team.title, ...(TEAM_ALIASES[team.title] || [])]
    const matched = aliases.some((alias) => {
      const normalized = normalize(alias)
      if (!normalized || normalized.length < 2) return false
      return text.includes(` ${normalized} `)
    })
    if (matched) refs.push(team._id)
  }

  return refs
}

function inferCategory(doc, categoryBySlug) {
  if (doc.category?._ref) return null
  if (doc.category?._id) return doc.category._id
  const format = doc.format || doc._type
  const slug = CATEGORY_BY_FORMAT[format] || (doc._type === 'headline' ? 'headlines' : null)
  return slug ? categoryBySlug.get(slug)?._id : null
}

function inferAdvancedTags(doc, tagBySlug) {
  const text = docText(doc)
  const refs = []
  for (const rule of TAG_RULES) {
    const tag = tagBySlug.get(rule.slug)
    if (tag && rule.pattern.test(text)) refs.push(tag._id)
  }
  return refs
}

function inferTopicHubs(doc, hubBySlug) {
  const text = docText(doc)
  const refs = []
  for (const rule of HUB_RULES) {
    const hub = hubBySlug.get(rule.slug)
    if (hub && rule.pattern.test(text)) refs.push(hub._id)
  }
  return refs
}

function isLegacyTwinOfArticle(doc, canonical) {
  return Boolean(canonical && doc._id !== canonical._id && ['headline', 'fantasyFootball', 'rankings'].includes(doc._type))
}

function buildDuplicateSyncPatch(doc, canonical) {
  if (!isLegacyTwinOfArticle(doc, canonical)) return null
  const set = {}
  const reasons = []

  for (const field of ['title', 'homepageTitle', 'summary', 'seo', 'category', 'topicHubs', 'tagRefs']) {
    setIfChanged(set, doc, field, canonical[field])
  }

  if (doc._type === 'headline') setIfChanged(set, doc, 'teams', canonical.teams)
  if (doc._type === 'headline') setIfChanged(set, doc, 'body', canonical.body)
  if (doc._type === 'fantasyFootball') setIfChanged(set, doc, 'content', canonical.body)

  if (!Object.keys(set).length) return null
  reasons.push(`sync legacy ${doc._type} twin from article doc`)
  return { set, unset: [], reasons }
}

function buildBasicsPatch(doc, indexes) {
  const set = {}
  const unset = []
  const reasons = []
  const existingSeo = doc.seo || {}

  const categoryId = inferCategory(doc, indexes.categoryBySlug)
  if (categoryId) {
    set.category = { _type: 'reference', _ref: categoryId }
    reasons.push(doc.category?._id && !doc.category?._ref ? 'repair category reference' : 'add category')
  }

  if (!compact(doc.homepageTitle)) {
    set.homepageTitle = buildHomepageTitle(doc.title)
    reasons.push('add homepageTitle')
  }

  const teamTagIds = new Set(indexes.teamDocs.map((team) => team._id))
  const existingTagRefs = Array.isArray(doc.tagRefs) ? doc.tagRefs : []
  const teamRefsFromTagRefs = existingTagRefs.map((ref) => ref?._ref).filter((id) => teamTagIds.has(id))
  const nonTeamTagRefs = existingTagRefs.filter((ref) => !teamTagIds.has(ref?._ref))

  const inferredTeamIds = detectTeamRefs(doc, indexes.teamDocs)
  if (['article', 'headline'].includes(doc._type)) {
    const nextTeams = uniqueRefs([...(doc.teams || []), ...teamRefsFromTagRefs, ...inferredTeamIds])
    if (!sameRefIds(doc.teams, nextTeams)) {
      set.teams = nextTeams
      reasons.push(teamRefsFromTagRefs.length ? 'move team refs into teams' : 'add inferred teams')
    }
  }

  const inferredTagIds = inferAdvancedTags(doc, indexes.tagBySlug)
  const nextTagRefs = uniqueRefs([...nonTeamTagRefs, ...inferredTagIds]).slice(0, MAX_REFS)
  if (!sameRefIds(existingTagRefs, nextTagRefs)) {
    set.tagRefs = nextTagRefs
    reasons.push(teamRefsFromTagRefs.length ? 'remove team docs from tagRefs/add canonical tags' : 'add canonical tags')
  }

  const inferredHubIds = inferTopicHubs(doc, indexes.hubBySlug)
  const nextTopicHubs = uniqueRefs([...(doc.topicHubs || []), ...inferredHubIds]).slice(0, 3)
  if (!sameRefIds(doc.topicHubs, nextTopicHubs)) {
    set.topicHubs = nextTopicHubs
    reasons.push('add topic hubs')
  }

  const nextSeo = {
    ...existingSeo,
    _type: 'seo',
    autoGenerate: existingSeo.autoGenerate ?? true,
    noIndex: existingSeo.noIndex ?? false,
  }

  let seoChanged = false
  if (isGenericMetaTitle(doc)) {
    nextSeo.metaTitle = buildMetaTitle(doc.title)
    nextSeo.ogTitle = nextSeo.metaTitle
    seoChanged = true
    reasons.push('improve generic metaTitle')
  }

  const metaDescription = compact(existingSeo.metaDescription)
  if (!metaDescription || metaDescription.length < 90 || metaDescription.includes('...')) {
    nextSeo.metaDescription = buildMetaDescription(doc.summary, doc.title)
    nextSeo.ogDescription = nextSeo.metaDescription
    seoChanged = true
    reasons.push('improve metaDescription')
  }

  if (seoChanged) {
    nextSeo.lastGenerated = new Date().toISOString()
    set.seo = nextSeo
  }

  return Object.keys(set).length || unset.length ? { set, unset, reasons } : null
}

async function fetchIndexes() {
  const [advancedTags, teamDocs, categories, hubs] = await Promise.all([
    client.fetch(`*[_type == "advancedTag" && defined(slug.current)]{_id,title,"slug":slug.current}`),
    client.fetch(`*[_type == "tag" && title in $teamNames]{_id,title,"slug":slug.current}`, { teamNames: TEAM_NAMES }),
    client.fetch(`*[_type == "category" && defined(slug.current)]{_id,title,"slug":slug.current}`),
    client.fetch(`*[_type == "topicHub" && defined(slug.current) && coalesce(active, true) == true && !(_id in path("drafts.**"))]{_id,title,"slug":slug.current}`),
  ])

  return {
    tagBySlug: new Map(advancedTags.map((tag) => [tag.slug, tag])),
    teamDocs,
    categoryBySlug: new Map(categories.map((category) => [category.slug, category])),
    hubBySlug: new Map(hubs.map((hub) => [hub.slug, hub])),
  }
}

async function fetchDocs() {
  const docs = await client.fetch(
    `*[
      _type in $types &&
      published == true &&
      !(_id in path("drafts.**")) &&
      (!defined(seo.noIndex) || seo.noIndex == false)
    ] | order(coalesce(date, publishedAt, _createdAt) desc) {
      ...,
      tagRefs[]{_type,_ref},
      teams[]{_type,_ref},
      topicHubs[]{_type,_ref}
    }`,
    { types: CONTENT_TYPES }
  )
  const sorted = docs.sort((a, b) => {
    const typeRank = (doc) => (doc._type === 'article' ? 0 : doc._type === 'rankings' ? 1 : 2)
    return typeRank(a) - typeRank(b)
  })
  return Number.isFinite(LIMIT) && LIMIT > 0 ? sorted.slice(0, LIMIT) : sorted
}

function canonicalArticleBySlug(docs) {
  const bySlug = new Map()
  for (const doc of docs) {
    const slug = doc.slug?.current
    if (!slug || doc._type !== 'article') continue
    const existing = bySlug.get(slug)
    if (!existing || new Date(doc._updatedAt || 0) > new Date(existing._updatedAt || 0)) {
      bySlug.set(slug, doc)
    }
  }
  return bySlug
}

async function main() {
  console.log(`Starting indexing basics backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)
  const [indexes, docs] = await Promise.all([fetchIndexes(), fetchDocs()])
  const canonicalBySlug = canonicalArticleBySlug(docs)
  console.log(`Loaded ${docs.length} published indexable docs, ${indexes.teamDocs.length} team tags.`)

  let changed = 0
  let skipped = 0

  for (const doc of docs) {
    const slug = doc.slug?.current
    const canonical = slug ? canonicalBySlug.get(slug) : null
    const patch = buildDuplicateSyncPatch(doc, canonical) || buildBasicsPatch(doc, indexes)

    if (!patch) {
      skipped++
      continue
    }

    changed++
    const label = `${doc._type}${doc.format ? `/${doc.format}` : ''} ${slug || doc._id}`
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${label}`)
    console.log(`  ${doc.title}`)
    console.log(`  reasons: ${patch.reasons.join(', ')}`)

    Object.assign(doc, patch.set)
    if (doc._type === 'article' && slug) canonicalBySlug.set(slug, doc)

    if (!DRY_RUN) {
      let request = client.patch(doc._id)
      if (Object.keys(patch.set).length) request = request.set(patch.set)
      if (patch.unset.length) request = request.unset(patch.unset)
      await request.commit({ autoGenerateArrayKeys: true })
      await sleep(75)
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped.`)
  if (DRY_RUN && token) console.log('Run again with --write to apply these indexing basics.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

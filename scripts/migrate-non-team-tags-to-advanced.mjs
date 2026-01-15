#!/usr/bin/env node
// Move non-team tag references into advancedTag docs and remove them from team fields.
// Usage:
//   node scripts/migrate-non-team-tags-to-advanced.mjs         # live run (requires SANITY_WRITE_TOKEN)
//   node scripts/migrate-non-team-tags-to-advanced.mjs --dry   # dry run/no writes

import sanityClient from '@sanity/client'
import dotenv from 'dotenv'

// Load .env.local first (common for Next/Sanity), then fallback to .env
dotenv.config({ path: '.env.local', override: false })
dotenv.config({ path: '.env', override: false })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_STUDIO_API_VERSION || '2024-06-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry') || !token

const client = sanityClient({ projectId, dataset, apiVersion, token, useCdn: false })

const TEAM_TITLES = [
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills', 'Carolina Panthers',
  'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns', 'Dallas Cowboys', 'Denver Broncos',
  'Detroit Lions', 'Green Bay Packers', 'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars',
  'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants', 'New York Jets',
  'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers', 'Seattle Seahawks', 'Tampa Bay Buccaneers',
  'Tennessee Titans', 'Washington Commanders'
]

const CONTENT_TYPES = ['article', 'headline', 'rankings', 'fantasyFootball']

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function fetchNonTeamTags() {
  const tags = await client.fetch(`*[_type == "tag" && !(title in $teams)]{ _id, title, slug }`, { teams: TEAM_TITLES })
  return tags
}

async function fetchAdvancedTagMap() {
  const items = await client.fetch(`*[_type == "advancedTag"]{ _id, title }`)
  const map = new Map()
  for (const t of items) {
    if (t.title) map.set(t.title.toLowerCase(), t)
  }
  return map
}

async function ensureAdvancedTag(tag, advMap) {
  const key = (tag.title || '').toLowerCase()
  if (!key) return null
  const existing = advMap.get(key)
  if (existing) return existing
  if (DRY_RUN) {
    const temp = { _id: `dry-${key}` }
    advMap.set(key, temp)
    return temp
  }
  const created = await client.create({
    _type: 'advancedTag',
    title: tag.title,
    slug: tag.slug || { _type: 'slug', current: key.slice(0, 96).replace(/[^a-z0-9-]/g, '-') },
  })
  advMap.set(key, created)
  return created
}

function mapRefs(arr = [], swapMap) {
  const next = []
  const seen = new Set()
  for (const r of arr) {
    if (!r || typeof r._ref !== 'string') continue
    const swap = swapMap.get(r._ref)
    const ref = swap || r._ref
    if (seen.has(ref)) continue
    seen.add(ref)
    next.push({ _type: 'reference', _ref: ref })
  }
  return next
}

function stripTeamRefs(arr = [], badIds) {
  return (arr || []).filter((r) => r && typeof r._ref === 'string' && !badIds.has(r._ref))
}

async function migrate() {
  console.log(`Dataset ${dataset} ${DRY_RUN ? '[DRY RUN]' : ''}`)

  const nonTeamTags = await fetchNonTeamTags()
  if (!nonTeamTags.length) {
    console.log('No non-team tags found; nothing to do.')
    return
  }
  console.log(`Found ${nonTeamTags.length} non-team tags to migrate.`)

  const advMap = await fetchAdvancedTagMap()
  const swapMap = new Map() // old tag _id -> new advancedTag _id

  for (const tag of nonTeamTags) {
    const adv = await ensureAdvancedTag(tag, advMap)
    if (adv?._id) swapMap.set(tag._id, adv._id)
  }

  const nonTeamIds = nonTeamTags.map((t) => t._id)

  const docs = await client.fetch(
    `*[_type in $types && ((defined(tagRefs) && references($ids)) || (defined(teams) && references($ids)))]{
      _id,
      _type,
      tagRefs,
      teams
    }`,
    { types: CONTENT_TYPES, ids: nonTeamIds }
  )

  console.log(`Found ${docs.length} documents to patch.`)

  let patched = 0
  for (const doc of docs) {
    const nextTagRefs = mapRefs(doc.tagRefs, swapMap)
    const nextTeams = stripTeamRefs(doc.teams, new Set(nonTeamIds))

    const patch = {}
    if (JSON.stringify(nextTagRefs) !== JSON.stringify(doc.tagRefs || [])) patch.tagRefs = nextTagRefs
    if (JSON.stringify(nextTeams) !== JSON.stringify(doc.teams || [])) patch.teams = nextTeams

    if (Object.keys(patch).length === 0) continue

    console.log(`${DRY_RUN ? 'Would patch' : 'Patching'} ${doc._type} ${doc._id}:`)
    if (patch.tagRefs) console.log('  tagRefs ->', patch.tagRefs.map((r) => r._ref))
    if (patch.teams) console.log('  teams ->', patch.teams.map((r) => r._ref))

    if (!DRY_RUN) {
      await client.patch(doc._id).set(patch).commit({ autoGenerateArrayKeys: true })
      patched++
      await sleep(50)
    }
  }

  console.log(`Done. ${patched} documents patched.${DRY_RUN ? ' (dry run)' : ''}`)
  console.log('After this, you can delete non-team tag docs safely; they are no longer referenced.')
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
// Copy any team tagRefs on headlines into the new `teams` field.
// Usage:
//   node scripts/backfill-teams-from-tagrefs.mjs            # executes with real writes
//   node scripts/backfill-teams-from-tagrefs.mjs --dry-run  # logs changes without patching

import sanityClient from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config()

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_STUDIO_API_VERSION || '2024-06-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

if (!token) {
  console.warn('No write token found. Script will run in read-only. Use --dry-run or set SANITY_WRITE_TOKEN.')
}

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

const client = sanityClient({ projectId, dataset, apiVersion, token, useCdn: false })
const DRY_RUN = process.argv.includes('--dry-run') || !token

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const toRef = (_ref) => ({ _type: 'reference', _ref })

async function fetchTeamTags() {
  const tags = await client.fetch(`*[_type == "tag" && title in $names]{ _id, title }`, { names: TEAM_NAMES })
  const missing = TEAM_NAMES.filter((name) => !tags.find((t) => t.title === name))
  if (missing.length) {
    console.warn(`Missing tag docs for ${missing.length} teams: ${missing.join(', ')}`)
  }
  return { tags, missing }
}

function mergeRefs(existingRefs, newRefs) {
  const merged = new Set()
  for (const id of existingRefs) if (id) merged.add(id)
  for (const id of newRefs) if (id) merged.add(id)
  return [...merged]
}

async function backfillHeadlineTeams(teamTagIds) {
  const docs = await client.fetch(`*[_type == "headline" && count(tagRefs) > 0]{ _id, tagRefs, teams }`)
  console.log(`Found ${docs.length} headlines with tagRefs`)

  let changed = 0
  let skipped = 0

  for (const doc of docs) {
    const existing = Array.isArray(doc.teams) ? doc.teams.map((r) => r?._ref).filter(Boolean) : []
    const teamRefsFromTagRefs = Array.isArray(doc.tagRefs)
      ? doc.tagRefs.map((r) => r?._ref).filter((id) => teamTagIds.has(id))
      : []

    if (teamRefsFromTagRefs.length === 0) {
      skipped++
      continue
    }

    const merged = mergeRefs(existing, teamRefsFromTagRefs)
    const added = merged.filter((id) => !existing.includes(id))

    if (added.length === 0) {
      skipped++
      continue
    }

    console.log(`[${doc._id}] adding ${added.length} team refs (total ${merged.length})`)

    if (!DRY_RUN) {
      await client
        .patch(doc._id)
        .set({ teams: merged.map(toRef) })
        .commit({ autoGenerateArrayKeys: true })
      changed++
      await sleep(50)
    }
  }

  console.log(`Backfill complete: ${changed} ${DRY_RUN ? 'would be patched' : 'patched'}, ${skipped} skipped.`)
}

async function main() {
  console.log(`Starting headline teams backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : ''}`)
  const { tags } = await fetchTeamTags()
  const teamTagIds = new Set(tags.map((t) => t._id))
  if (teamTagIds.size === 0) {
    console.error('No team tag documents found; aborting.')
    process.exit(1)
  }
  await backfillHeadlineTeams(teamTagIds)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
// Copies team tag references into the new `teams` field on headlines.
// Uses your existing tag documents (32 NFL teams). No publishes are done; it patches drafts/published as-is.

import 'dotenv/config'
import {createClient} from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN

if (!projectId || !token) {
  console.error('Missing SANITY projectId or token. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2023-07-01', token, useCdn: false })

// Canonical team names to match against tag titles (case-insensitive)
const TEAM_NAMES = [
  'Arizona Cardinals','Atlanta Falcons','Baltimore Ravens','Buffalo Bills','Carolina Panthers','Chicago Bears','Cincinnati Bengals','Cleveland Browns','Dallas Cowboys','Denver Broncos','Detroit Lions','Green Bay Packers','Houston Texans','Indianapolis Colts','Jacksonville Jaguars','Kansas City Chiefs','Las Vegas Raiders','Los Angeles Chargers','Los Angeles Rams','Miami Dolphins','Minnesota Vikings','New England Patriots','New Orleans Saints','New York Giants','New York Jets','Philadelphia Eagles','Pittsburgh Steelers','San Francisco 49ers','Seattle Seahawks','Tampa Bay Buccaneers','Tennessee Titans','Washington Commanders'
]

const toKey = (s) => s.trim().toLowerCase()

async function main() {
  const tags = await client.fetch(`*[_type == "tag"]{_id,title}`)
  const teamIds = new Set(
    tags.filter((t) => TEAM_NAMES.some((n) => toKey(n) === toKey(t.title))).map((t) => t._id)
  )

  if (!teamIds.size) {
    console.error('No team tags found. Ensure your 32 team tags exist in the tag docs.')
    return
  }

  console.log(`Found ${teamIds.size} team tags`) // should be 32

  const headlines = await client.fetch(
    `*[_type == "headline" && defined(tagRefs) && count(tagRefs[@._ref in $teamIds]) > 0]{ _id, tagRefs, _rev }`,
    { teamIds: Array.from(teamIds) }
  )

  if (!headlines.length) {
    console.log('No headlines with team tagRefs found; nothing to migrate.')
    return
  }

  console.log(`Migrating ${headlines.length} headlines...`)

  for (const doc of headlines) {
    const teamRefs = (doc.tagRefs || []).filter((ref) => teamIds.has(ref._ref))
    if (!teamRefs.length) continue

    await client
      .patch(doc._id)
      .setIfMissing({ teams: [] })
      .insert('replace', 'teams', teamRefs) // replace entire teams array
      .commit({ autoGenerateArrayKeys: true })

    console.log(`Updated ${doc._id} with ${teamRefs.length} team refs`)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

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

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

if (!token) {
  console.error('Missing SANITY write token. Set SANITY_WRITE_TOKEN and rerun.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

const HUBS = [
  {
    title: 'NFL Draft',
    navLabel: 'Draft',
    slug: 'draft',
    description:
      'Year-round NFL Draft coverage from The Snap, including mock drafts, prospect rankings, team needs, and draft-day analysis.',
    intro:
      'Track the full draft cycle from all-star games and combine testing through pro days, final boards, and draft night picks.',
    accentColor: '#1D9BF0',
    priority: 10,
    relatedTagSlugs: [
      'nfl-draft',
      'nfl-mock-draft',
      'draft-prospects',
      'draft-big-board',
      'draft-order',
      'team-needs',
      'scouting-reports',
      'pro-day',
      'senior-bowl',
      'undrafted-free-agents',
    ],
  },
  {
    title: 'NFL Combine',
    navLabel: 'Combine',
    slug: 'nfl-combine',
    description:
      'NFL Combine news, testing results, standout performances, and prospect movement updates.',
    intro:
      'Follow measurable data, positional standouts, and how combine results impact draft boards.',
    accentColor: '#14B8A6',
    priority: 20,
    relatedTagSlugs: ['nfl-combine', 'draft-prospects', 'draft-big-board', 'pro-day'],
  },
  {
    title: 'NFL Free Agency',
    navLabel: 'Free Agency',
    slug: 'nfl-free-agency',
    description:
      'NFL free agency signings, rumors, contract analysis, and roster impact coverage.',
    intro:
      'Stay on top of legal tampering, major signings, franchise tags, cap moves, and value deals around the league.',
    accentColor: '#22C55E',
    priority: 30,
    relatedTagSlugs: [
      'nfl-free-agency',
      'legal-tampering-period',
      'franchise-tag',
      'nfl-salary-cap',
      'roster-moves',
      'trade-rumors',
    ],
  },
  {
    title: 'NFL Trade Deadline',
    navLabel: 'Trades',
    slug: 'nfl-trade-deadline',
    description:
      'NFL trade deadline rumors, completed deals, and team-by-team impact analysis.',
    intro:
      'Follow contenders and sellers, deadline strategy, and immediate fantasy and playoff implications.',
    accentColor: '#F97316',
    priority: 40,
    relatedTagSlugs: ['nfl-trade-deadline', 'trade-rumors', 'roster-moves'],
  },
  {
    title: 'NFL Schedule Release',
    navLabel: 'Schedule',
    slug: 'nfl-schedule-release',
    description:
      'NFL schedule release breakdowns, strength of schedule, and best matchups each season.',
    intro:
      'See primetime draws, travel spots, and early projections from opening week through the stretch run.',
    accentColor: '#3B82F6',
    priority: 50,
    relatedTagSlugs: [
      'nfl-schedule-release',
      'primetime-games',
      'nfl-kickoff-game',
      'season-opener',
      'international-series',
      'christmas-games',
      'thanksgiving-games',
    ],
  },
  {
    title: 'NFL Training Camp',
    navLabel: 'Camp',
    slug: 'nfl-training-camp',
    description:
      'NFL training camp updates, depth chart battles, injury reports, and preseason standouts.',
    intro:
      'Track position competitions, roster trends, and key developments before Week 1.',
    accentColor: '#EAB308',
    priority: 60,
    relatedTagSlugs: [
      'training-camp',
      'mandatory-minicamp',
      'otas',
      'roster-cuts',
      'injury-report',
      'hall-of-fame-game',
    ],
  },
  {
    title: 'NFL Preseason',
    navLabel: 'Preseason',
    slug: 'nfl-preseason',
    description:
      'NFL preseason game recaps, roster evaluations, and final 53-man projection coverage.',
    intro:
      'Get preseason stock watch updates, quarterback competitions, and roster decisions as teams prepare for the regular season.',
    accentColor: '#A855F7',
    priority: 70,
    relatedTagSlugs: ['preseason', 'roster-cuts', 'hall-of-fame-game', 'qb-watch', 'rookie-rankings'],
  },
  {
    title: 'NFL Regular Season',
    navLabel: 'Season',
    slug: 'nfl-regular-season',
    description:
      'Weekly NFL regular season coverage featuring headlines, injuries, rankings, and game analysis.',
    intro:
      'Follow every week of the season with updated power rankings, playoff races, and team trend analysis.',
    accentColor: '#0EA5E9',
    priority: 80,
    relatedTagSlugs: [
      'nfl',
      'power-rankings',
      'team-rankings',
      'offensive-rankings',
      'defensive-rankings',
      'injury-report',
      'playoff-picture',
    ],
  },
  {
    title: 'NFL Power Rankings',
    navLabel: 'Power',
    slug: 'nfl-power-rankings',
    description:
      'Weekly NFL power rankings with biggest risers, biggest fallers, and full 1-32 team analysis.',
    intro:
      'Track weekly movement across all 32 teams with tier context, trend signals, and playoff pressure points.',
    accentColor: '#0284C7',
    priority: 85,
    relatedTagSlugs: [
      'power-rankings',
      'team-rankings',
      'offensive-rankings',
      'defensive-rankings',
      'playoff-picture',
    ],
  },
  {
    title: 'NFL Playoffs',
    navLabel: 'Playoffs',
    slug: 'nfl-playoffs',
    description:
      'NFL playoff bracket updates, matchup previews, and postseason game analysis.',
    intro:
      'Coverage from Wild Card weekend through Conference Championships, including key storylines and matchup edges.',
    accentColor: '#EF4444',
    priority: 90,
    relatedTagSlugs: [
      'nfl-playoffs',
      'wild-card-round',
      'divisional-round',
      'conference-championship',
      'playoff-picture',
    ],
  },
  {
    title: 'Super Bowl',
    navLabel: 'Super Bowl',
    slug: 'super-bowl',
    description:
      'Super Bowl news, matchup previews, x-factors, and postgame analysis from The Snap.',
    intro:
      'From opening night to final whistle, track injury updates, strategy breakdowns, and legacy-defining moments.',
    accentColor: '#F59E0B',
    priority: 100,
    relatedTagSlugs: ['super-bowl', 'superbowl', 'pro-bowl-games'],
  },
  {
    title: 'NFL Coaching Cycle',
    navLabel: 'Coaching',
    slug: 'nfl-coaching-cycle',
    description:
      'NFL coaching cycle updates including firings, interviews, hires, and staff changes.',
    intro:
      'Follow every head coach and coordinator opening with candidate analysis and team fit projections.',
    accentColor: '#06B6D4',
    priority: 110,
    relatedTagSlugs: ['nfl-coaching-cycle', 'head-coach-search'],
  },
  {
    title: 'Franchise Watch',
    navLabel: 'Franchise',
    slug: 'franchise-watch',
    description:
      'NFL ownership and franchise sale coverage, including valuations, bidders, and league approval milestones.',
    intro:
      'Track team sale announcements, ownership transitions, estate-led processes, and what each move means across the league.',
    accentColor: '#0F766E',
    priority: 115,
    relatedTagSlugs: [
      'nfl-ownership',
      'franchise-sales',
      'ownership-changes',
      'team-valuation',
      'ownership-bids',
      'nfl-owners-meetings',
    ],
    seedTags: [
      {
        title: 'Franchise Sales',
        slug: 'franchise-sales',
        aliases: ['team sale', 'franchise sale process', 'sale process'],
        description:
          'News and analysis around team sale timelines, transaction structure, and expected close windows.',
      },
      {
        title: 'Ownership Changes',
        slug: 'ownership-changes',
        aliases: ['new ownership', 'ownership transition', 'ownership shift'],
        description:
          'Coverage of ownership transitions, controlling stake changes, and long-term governance impact.',
      },
      {
        title: 'Team Valuation',
        slug: 'team-valuation',
        aliases: ['franchise valuation', 'valuation', 'sale price'],
        description:
          'Franchise valuation trends, record sale comps, and market pricing context across the NFL.',
      },
      {
        title: 'Ownership Bids',
        slug: 'ownership-bids',
        aliases: ['bidders', 'ownership group', 'purchase bids'],
        description:
          'Reports on prospective buyers, bid groups, and negotiations during ownership sales.',
      },
    ],
  },
  {
    title: 'NFL Offseason',
    navLabel: 'Offseason',
    slug: 'nfl-offseason',
    description:
      'NFL offseason coverage on roster building, cap decisions, coaching moves, and league trends.',
    intro:
      'A central hub for major offseason developments between the Super Bowl and kickoff.',
    accentColor: '#64748B',
    priority: 120,
    relatedTagSlugs: [
      'nfl-free-agency',
      'nfl-draft',
      'nfl-combine',
      'nfl-salary-cap',
      'franchise-tag',
      'nfl-owners-meetings',
      'legal-tampering-period',
    ],
  },
]

function toSlugValue(slug) {
  return { _type: 'slug', current: slug }
}

function toRef(id) {
  return { _type: 'reference', _ref: id }
}

function dedupeRefs(refs) {
  const seen = new Set()
  const out = []
  for (const ref of refs) {
    const id = ref?._ref
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push({ _type: 'reference', _ref: id })
  }
  return out
}

function uniqueStrings(values) {
  const seen = new Set()
  const out = []
  for (const value of values || []) {
    if (typeof value !== 'string') continue
    const next = value.trim()
    if (!next) continue
    const key = next.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(next)
  }
  return out
}

function dedupeSeedTags(tags) {
  const seen = new Set()
  const out = []
  for (const tag of tags || []) {
    const slug = typeof tag?.slug === 'string' ? tag.slug.trim().toLowerCase() : ''
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({
      ...tag,
      slug,
      aliases: uniqueStrings(tag.aliases || []),
    })
  }
  return out
}

async function ensureAdvancedTag(tag) {
  const slug = typeof tag?.slug === 'string' ? tag.slug.trim().toLowerCase() : ''
  const title = typeof tag?.title === 'string' ? tag.title.trim() : ''
  if (!slug || !title) return null

  const existing = await client.fetch(
    `*[_type=="advancedTag" && slug.current == $slug][0]{ _id, aliases, description }`,
    { slug }
  )

  if (existing?._id) {
    const aliases = uniqueStrings([...(existing.aliases || []), ...(tag.aliases || [])])
    const patch = client.patch(existing._id)
    patch.setIfMissing({
      title,
      slug: toSlugValue(slug),
      description: tag.description,
    })
    if (aliases.length > 0) patch.set({ aliases })
    await patch.commit({ autoGenerateArrayKeys: true })
    console.log(`Ensured canonical tag: ${title} (${slug})`)
    return existing._id
  }

  const created = await client.create({
    _type: 'advancedTag',
    title,
    slug: toSlugValue(slug),
    aliases: uniqueStrings(tag.aliases || []),
    description: tag.description,
  })
  console.log(`Created canonical tag: ${title} (${slug})`)
  return created._id
}

async function fetchTagIdMap() {
  const tags = await client.fetch(
    `*[_type=="advancedTag" && defined(slug.current)]{_id, "slug": slug.current}`
  )
  const map = new Map()
  for (const tag of tags) {
    if (typeof tag.slug === 'string') map.set(tag.slug, tag._id)
  }
  return map
}

async function upsertHub(hub, tagIdMap) {
  const existing = await client.fetch(
    `*[_type=="topicHub" && slug.current==$slug && !(_id in path("drafts.**"))][0]{_id, relatedTags}`,
    { slug: hub.slug }
  )

  const mappedRefs = hub.relatedTagSlugs
    .map((slug) => tagIdMap.get(slug))
    .filter(Boolean)
    .map((id) => toRef(id))
  const missingSlugs = hub.relatedTagSlugs.filter((slug) => !tagIdMap.has(slug))
  if (missingSlugs.length) {
    console.warn(`Warning: missing canonical tags for hub "${hub.slug}": ${missingSlugs.join(', ')}`)
  }

  const existingRefs = Array.isArray(existing?.relatedTags) ? existing.relatedTags : []
  const nextRelatedTags = dedupeRefs([...existingRefs, ...mappedRefs])

  const baseDoc = {
    title: hub.title,
    navLabel: hub.navLabel,
    slug: toSlugValue(hub.slug),
    description: hub.description,
    intro: hub.intro,
    accentColor: hub.accentColor,
    active: true,
    priority: hub.priority,
    relatedTags: nextRelatedTags,
  }

  if (existing?._id) {
    await client
      .patch(existing._id)
      .setIfMissing({
        title: baseDoc.title,
        navLabel: baseDoc.navLabel,
        description: baseDoc.description,
        intro: baseDoc.intro,
        accentColor: baseDoc.accentColor,
        active: baseDoc.active,
        priority: baseDoc.priority,
      })
      .set({ relatedTags: baseDoc.relatedTags })
      .commit({ autoGenerateArrayKeys: true })

    console.log(`Updated topic hub: ${hub.title} (${hub.slug})`)
    return
  }

  await client.create({
    _type: 'topicHub',
    ...baseDoc,
  })
  console.log(`Created topic hub: ${hub.title} (${hub.slug})`)
}

async function main() {
  const seedTags = dedupeSeedTags(HUBS.flatMap((hub) => hub.seedTags || []))
  for (const tag of seedTags) {
    await ensureAdvancedTag(tag)
  }

  const tagIdMap = await fetchTagIdMap()
  for (const hub of HUBS) {
    await upsertHub(hub, tagIdMap)
  }
  console.log(`Done. Ensured ${HUBS.length} topic hubs in dataset "${dataset}".`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

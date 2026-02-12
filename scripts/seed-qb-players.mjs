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

const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_TOKEN

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}

if (!token) {
  console.error('Missing SANITY write token. Set SANITY_WRITE_TOKEN and rerun.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

const QBS = [
  {
    rank: 1,
    tier: 1,
    name: 'Matthew Stafford',
    team: 'LAR',
    years: 'Year 17',
    stats:
      '20 games | 63.4 pct | 5643 pass yds | 7.9 ypa | 52 pass TDs | 9 INTs | 16 rush yds | 0 rush TDs | 10 fumbles',
    summary:
      '2025 NFL MVP who pushed the Rams deep into the postseason with elite arm talent, accuracy, and late-game control.',
  },
  {
    rank: 2,
    tier: 1,
    name: 'Josh Allen',
    team: 'BUF',
    years: 'Year 8',
    stats:
      '19 games | 69.7 pct | 4224 pass yds | 7.9 ypa | 29 pass TDs | 12 INTs | 678 rush yds | 16 rush TDs | 10 fumbles',
    summary: 'Dynamic dual-threat engine for Buffalo with elite weekly ceiling and unmatched red-zone rushing impact.',
  },
  {
    rank: 3,
    tier: 1,
    name: 'Dak Prescott',
    team: 'DAL',
    years: 'Year 10',
    stats:
      '17 games | 67.3 pct | 4552 pass yds | 7.6 ypa | 30 pass TDs | 10 INTs | 177 rush yds | 2 rush TDs | 6 fumbles',
    summary: 'High-volume passer who held Dallas together and delivered one of the strongest pure throwing seasons in the league.',
  },
  {
    rank: 4,
    tier: 1,
    name: 'Drake Maye',
    team: 'NE',
    years: 'Year 2',
    stats:
      '21 games | 69.3 pct | 5222 pass yds | 8.5 ypa | 37 pass TDs | 12 INTs | 628 rush yds | 5 rush TDs | 15 fumbles',
    summary: 'Breakout sophomore campaign with MVP-level flashes, big-play creation, and major growth as a franchise centerpiece.',
  },
  {
    rank: 5,
    tier: 1,
    name: 'Justin Herbert',
    team: 'LAC',
    years: 'Year 6',
    stats:
      '17 games | 66.1 pct | 3886 pass yds | 7.2 ypa | 26 pass TDs | 13 INTs | 555 rush yds | 2 rush TDs | 9 fumbles',
    summary: 'Carried the Chargers through injuries with toughness, off-script production, and top-tier arm strength.',
  },
  {
    rank: 6,
    tier: 1,
    name: 'Trevor Lawrence',
    team: 'JAX',
    years: 'Year 5',
    stats:
      '18 games | 60.8 pct | 4214 pass yds | 7.1 ypa | 32 pass TDs | 14 INTs | 390 rush yds | 9 rush TDs | 5 fumbles',
    summary: 'Best pro season to date with improved mobility usage and downfield command in a surging Jaguars offense.',
  },
  {
    rank: 7,
    tier: 2,
    name: 'Sam Darnold',
    team: 'SEA',
    years: 'Year 8',
    stats:
      '20 games | 66.7 pct | 4720 pass yds | 8.3 ypa | 30 pass TDs | 14 INTs | 109 rush yds | 0 rush TDs | 12 fumbles',
    summary: 'Super Bowl-winning season with timely postseason play and strong command of Seattles offense.',
  },
  {
    rank: 8,
    tier: 2,
    name: 'Caleb Williams',
    team: 'CHI',
    years: 'Year 2',
    stats:
      '19 games | 57.3 pct | 4560 pass yds | 6.9 ypa | 31 pass TDs | 12 INTs | 448 rush yds | 3 rush TDs | 10 fumbles',
    summary: 'Year 2 leap with major late-season heroics and clutch postseason moments for a rising Bears offense.',
  },
  {
    rank: 9,
    tier: 2,
    name: 'Jared Goff',
    team: 'DET',
    years: 'Year 10',
    stats:
      '17 games | 68.0 pct | 4564 pass yds | 7.9 ypa | 34 pass TDs | 8 INTs | 45 rush yds | 0 rush TDs | 6 fumbles',
    summary: 'Efficient high-output passer whose steady production remained near elite despite team-level offensive decline.',
  },
  {
    rank: 10,
    tier: 2,
    name: 'Joe Burrow',
    team: 'CIN',
    years: 'Year 6',
    stats:
      '8 games | 66.8 pct | 1809 pass yds | 7.0 ypa | 17 pass TDs | 5 INTs | 41 rush yds | 0 rush TDs | 0 fumbles',
    summary: 'Limited by missed time but returned with high-level accuracy, rhythm passing, and strong touchdown efficiency.',
  },
  {
    rank: 11,
    tier: 2,
    name: 'Lamar Jackson',
    team: 'BAL',
    years: 'Year 8',
    stats:
      '13 games | 63.6 pct | 2549 pass yds | 8.4 ypa | 21 pass TDs | 7 INTs | 349 rush yds | 2 rush TDs | 7 fumbles',
    summary: 'Played through injuries and still flashed game-breaking dual-threat skill once fully healthy late in the year.',
  },
  {
    rank: 12,
    tier: 2,
    name: 'Daniel Jones',
    team: 'IND',
    years: 'Year 7',
    stats:
      '13 games | 68.0 pct | 3101 pass yds | 8.1 ypa | 19 pass TDs | 8 INTs | 164 rush yds | 5 rush TDs | 9 fumbles',
    summary: 'Career reset in Indianapolis with efficient passing and movement-game value before injuries stalled momentum.',
  },
  {
    rank: 13,
    tier: 2,
    name: 'Patrick Mahomes',
    team: 'KC',
    years: 'Year 9',
    stats:
      '14 games | 62.7 pct | 3587 pass yds | 7.1 ypa | 22 pass TDs | 11 INTs | 422 rush yds | 5 rush TDs | 3 fumbles',
    summary: 'Still a top-tier talent, though 2025 featured tighter windows, lower margin, and an injury-shortened finish.',
  },
  {
    rank: 14,
    tier: 3,
    name: 'Jordan Love',
    team: 'GB',
    years: 'Year 6',
    stats:
      '16 games | 64.9 pct | 3704 pass yds | 7.6 ypa | 27 pass TDs | 6 INTs | 210 rush yds | 0 rush TDs | 8 fumbles',
    summary: 'Produced big spikes and strong peak games, with consistency still the key swing factor for Green Bay.',
  },
  {
    rank: 15,
    tier: 3,
    name: 'Brock Purdy',
    team: 'SF',
    years: 'Year 4',
    stats:
      '11 games | 67.3 pct | 2569 pass yds | 7.5 ypa | 22 pass TDs | 13 INTs | 208 rush yds | 3 rush TDs | 5 fumbles',
    summary: 'Injuries disrupted rhythm, but his best stretches still showed high-end timing and explosive-play command.',
  },
  {
    rank: 16,
    tier: 3,
    name: 'Aaron Rodgers',
    team: 'PIT',
    years: 'Year 21',
    stats:
      '17 games | 64.8 pct | 3468 pass yds | 6.5 ypa | 24 pass TDs | 8 INTs | 61 rush yds | 1 rush TD | 6 fumbles',
    summary: 'Veteran-level control and pocket management helped keep Pittsburgh in playoff position all year.',
  },
  {
    rank: 17,
    tier: 3,
    name: 'Baker Mayfield',
    team: 'TB',
    years: 'Year 8',
    stats:
      '17 games | 63.2 pct | 3693 pass yds | 6.8 ypa | 26 pass TDs | 11 INTs | 382 rush yds | 1 rush TD | 11 fumbles',
    summary: 'Competitive and productive but streaky, with swings in efficiency that mirrored Tampa Bays season arc.',
  },
  {
    rank: 18,
    tier: 3,
    name: 'Bo Nix',
    team: 'DEN',
    years: 'Year 2',
    stats:
      '18 games | 62.9 pct | 4210 pass yds | 6.4 ypa | 28 pass TDs | 12 INTs | 385 rush yds | 5 rush TDs | 5 fumbles',
    summary: 'Late-season improvement gave Denver clear optimism that his best football is still ahead.',
  },
  {
    rank: 19,
    tier: 3,
    name: 'Jalen Hurts',
    team: 'PHI',
    years: 'Year 6',
    stats:
      '17 games | 64.2 pct | 3392 pass yds | 6.9 ypa | 26 pass TDs | 6 INTs | 435 rush yds | 8 rush TDs | 8 fumbles',
    summary: 'Remained dangerous in tempo and red-zone packages, with system tweaks expected to unlock more in 2026.',
  },
  {
    rank: 20,
    tier: 3,
    name: 'C.J. Stroud',
    team: 'HOU',
    years: 'Year 3',
    stats:
      '16 games | 62.5 pct | 3503 pass yds | 7.0 ypa | 21 pass TDs | 13 INTs | 220 rush yds | 1 rush TD | 7 fumbles',
    summary: 'Flashes remained high-end, but efficiency and decision-making dipped more often than expected.',
  },
  {
    rank: 21,
    tier: 4,
    name: 'Bryce Young',
    team: 'CAR',
    years: 'Year 3',
    stats:
      '17 games | 62.7 pct | 3275 pass yds | 6.3 ypa | 24 pass TDs | 12 INTs | 240 rush yds | 3 rush TDs | 7 fumbles',
    summary: 'Toolset is clear; next step is week-to-week consistency and cleaner turnover stretches.',
  },
  {
    rank: 22,
    tier: 4,
    name: 'Tyler Shough',
    team: 'NO',
    years: 'Rookie',
    stats:
      '11 games | 67.6 pct | 2384 pass yds | 7.3 ypa | 10 pass TDs | 6 INTs | 186 rush yds | 3 rush TDs | 3 fumbles',
    summary: 'Promising rookie tape with quick processing, timing throws, and encouraging long-term starter traits.',
  },
  {
    rank: 23,
    tier: 4,
    name: 'Jaxson Dart',
    team: 'NYG',
    years: 'Rookie',
    stats:
      '14 games | 63.7 pct | 2272 pass yds | 6.7 ypa | 15 pass TDs | 5 INTs | 487 rush yds | 9 rush TDs | 5 fumbles',
    summary: 'Brought energy and playmaking to New York, with durability management becoming a major year-two priority.',
  },
  {
    rank: 24,
    tier: 4,
    name: 'Malik Willis',
    team: 'GB',
    years: 'Year 4',
    stats:
      '4 games | 85.7 pct | 422 pass yds | 12.1 ypa | 3 pass TDs | 0 INTs | 123 rush yds | 2 rush TDs | 2 fumbles',
    summary: 'Small sample, but efficient and explosive in spot duty with visible growth as a passer.',
  },
  {
    rank: 25,
    tier: 4,
    name: 'Mac Jones',
    team: 'SF',
    years: 'Year 5',
    stats:
      '12 games | 69.3 pct | 2155 pass yds | 7.4 ypa | 13 pass TDs | 6 INTs | 67 rush yds | 0 rush TDs | 4 fumbles',
    summary: 'Handled extended backup action well and kept San Franciscos offense competitive in key stretches.',
  },
  {
    rank: 26,
    tier: 4,
    name: 'Jacoby Brissett',
    team: 'ARI',
    years: 'Year 10',
    stats:
      '14 games | 64.9 pct | 3366 pass yds | 6.9 ypa | 23 pass TDs | 8 INTs | 168 rush yds | 1 rush TD | 5 fumbles',
    summary: 'Reliable veteran production with efficient ball security and enough mobility to keep drives alive.',
  },
  {
    rank: 27,
    tier: 4,
    name: 'Cam Ward',
    team: 'TEN',
    years: 'Rookie',
    stats:
      '17 games | 59.8 pct | 3169 pass yds | 5.9 ypa | 15 pass TDs | 7 INTs | 159 rush yds | 2 rush TDs | 11 fumbles',
    summary: 'Flashed high-end talent in a difficult rookie environment and remains a key long-term Titans bet.',
  },
  {
    rank: 28,
    tier: 4,
    name: 'Kirk Cousins',
    team: 'ATL',
    years: 'Year 14',
    stats:
      '10 games | 61.7 pct | 1721 pass yds | 6.4 ypa | 10 pass TDs | 5 INTs | 7 rush yds | 1 rush TD | 3 fumbles',
    summary: 'Steady bridge-veteran profile with enough timing and command to stabilize stretches of offense.',
  },
  {
    rank: 29,
    tier: 4,
    name: 'Marcus Mariota',
    team: 'WAS',
    years: 'Year 11',
    stats:
      '11 games | 61.2 pct | 1695 pass yds | 7.5 ypa | 10 pass TDs | 7 INTs | 297 rush yds | 1 rush TD | 6 fumbles',
    summary: 'Solid spot starter who provided consistent effort, mobility value, and veteran composure.',
  },
  {
    rank: 30,
    tier: 5,
    name: 'Kyler Murray',
    team: 'ARI',
    years: 'Year 7',
    stats:
      '5 games | 68.3 pct | 962 pass yds | 6.0 ypa | 6 pass TDs | 3 INTs | 173 rush yds | 1 rush TD | 1 fumble',
    summary: 'Limited sample in 2025 but still offered play-extension ability and off-platform creation.',
  },
  {
    rank: 31,
    tier: 5,
    name: 'Joe Flacco',
    team: 'CIN',
    years: 'Year 18',
    stats:
      '13 games | 60.3 pct | 2479 pass yds | 6.0 ypa | 15 pass TDs | 10 INTs | 35 rush yds | 1 rush TD | 3 fumbles',
    summary: 'Veteran depth profile with traditional pocket passing and situational game-management value.',
  },
  {
    rank: 32,
    tier: 5,
    name: 'Davis Mills',
    team: 'HOU',
    years: 'Year 5',
    stats:
      '6 games | 57.2 pct | 915 pass yds | 5.8 ypa | 5 pass TDs | 1 INT | 60 rush yds | 1 rush TD | 1 fumble',
    summary: 'Depth quarterback who can execute structure and provide emergency starts when needed.',
  },
  {
    rank: 33,
    tier: 5,
    name: 'J.J. McCarthy',
    team: 'MIN',
    years: 'Year 2',
    stats:
      '10 games | 57.6 pct | 1632 pass yds | 6.7 ypa | 11 pass TDs | 12 INTs | 181 rush yds | 4 rush TDs | 6 fumbles',
    summary: 'Volatile second-year sample with clear athletic traits but decision-making still in development.',
  },
  {
    rank: 34,
    tier: 5,
    name: 'Michael Penix Jr.',
    team: 'ATL',
    years: 'Year 2',
    stats:
      '9 games | 60.1 pct | 1982 pass yds | 7.2 ypa | 9 pass TDs | 3 INTs | 70 rush yds | 1 rush TD | 4 fumbles',
    summary: 'Strong arm and vertical traits showed up, with continued growth needed in full-game consistency.',
  },
  {
    rank: 35,
    tier: 5,
    name: 'Geno Smith',
    team: 'LV',
    years: 'Year 13',
    stats:
      '15 games | 67.4 pct | 3025 pass yds | 6.8 ypa | 19 pass TDs | 17 INTs | 109 rush yds | 0 rush TDs | 4 fumbles',
    summary: 'Completion rate remained high, but turnover pressure and volatility dragged overall efficiency.',
  },
  {
    rank: 36,
    tier: 5,
    name: 'Philip Rivers',
    team: 'IND',
    years: 'Year 18',
    stats:
      '3 games | 63.0 pct | 544 pass yds | 5.9 ypa | 4 pass TDs | 3 INTs | -1 rush yds | 0 rush TDs | 2 fumbles',
    summary: 'Short veteran cameo with classic pocket timing and quick-game command.',
  },
  {
    rank: 37,
    tier: 5,
    name: 'Tua Tagovailoa',
    team: 'MIA',
    years: 'Year 6',
    stats:
      '14 games | 67.7 pct | 2660 pass yds | 6.9 ypa | 20 pass TDs | 15 INTs | 43 rush yds | 0 rush TDs | 8 fumbles',
    summary: 'Accurate distributor with explosive spurts, but interception volume rose in key stretches.',
  },
  {
    rank: 38,
    tier: 5,
    name: 'Jayden Daniels',
    team: 'WAS',
    years: 'Year 2',
    stats:
      '7 games | 60.6 pct | 1262 pass yds | 6.7 ypa | 8 pass TDs | 3 INTs | 278 rush yds | 2 rush TDs | 3 fumbles',
    summary: 'Limited sample due to missed time, though the dual-threat upside remains obvious on tape.',
  },
  {
    rank: 39,
    tier: 5,
    name: 'Mason Rudolph',
    team: 'PIT',
    years: 'Year 7',
    stats:
      '6 games | 73.6 pct | 312 pass yds | 5.9 ypa | 2 pass TDs | 2 INTs | 6 rush yds | 0 rush TDs | 1 fumble',
    summary: 'Backup option with pocket poise and quick processing in controlled passing situations.',
  },
  {
    rank: 40,
    tier: 5,
    name: 'Jameis Winston',
    team: 'NYG',
    years: 'Year 11',
    stats: '2025 stat line not provided in source notes.',
    summary: 'Experienced veteran quarterback with high-variance play style and strong arm talent.',
  },
]

const MANUAL_ALIAS_MAP = {
  'Matthew Stafford': ['Matt Stafford'],
  'Dak Prescott': ['Rayne Prescott'],
  'Patrick Mahomes': ['Pat Mahomes'],
  'C.J. Stroud': ['CJ Stroud', 'C J Stroud'],
  'J.J. McCarthy': ['JJ McCarthy', 'J J McCarthy'],
  'Michael Penix Jr.': ['Michael Penix Jr', 'Mike Penix Jr'],
  'Tua Tagovailoa': ['Tuanigamanuolepola Tagovailoa'],
}

const NICKNAME_MAP = {
  Matthew: 'Matt',
  Joseph: 'Joe',
  Michael: 'Mike',
  Philip: 'Phil',
  Patrick: 'Pat',
  Daniel: 'Danny',
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function getLastName(parts) {
  const suffixes = new Set(['jr', 'jr.', 'ii', 'iii', 'iv', 'v'])
  const copy = [...parts]
  while (copy.length > 1 && suffixes.has(copy[copy.length - 1].toLowerCase())) copy.pop()
  return copy[copy.length - 1]
}

function buildAliases(name) {
  const aliases = new Set()
  const cleanNoDots = name.replace(/\./g, '').replace(/\s+/g, ' ').trim()
  if (cleanNoDots !== name) aliases.add(cleanNoDots)

  const parts = cleanNoDots.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]
    const last = getLastName(parts)
    aliases.add(`${first[0]}. ${last}`)
    if (NICKNAME_MAP[first]) aliases.add(`${NICKNAME_MAP[first]} ${last}`)
  }

  if (MANUAL_ALIAS_MAP[name]) {
    MANUAL_ALIAS_MAP[name].forEach((alias) => aliases.add(alias))
  }

  return [...aliases].filter((alias) => alias && alias.toLowerCase() !== name.toLowerCase())
}

function buildBio(player) {
  return `Ranked #${player.rank} in Tier ${player.tier} of the 2025 QB stack. ${player.team} ${player.years}. 2025 stats: ${player.stats} ${player.summary}`
}

async function main() {
  const names = QBS.map((p) => p.name)
  const slugs = QBS.map((p) => slugify(p.name))

  const existing = await client.fetch(
    `*[_type == "player" && (name in $names || slug.current in $slugs)]{
      _id,
      name,
      "slug": slug.current
    }`,
    { names, slugs }
  )

  const bySlug = new Map()
  const byName = new Map()

  for (const doc of existing) {
    if (doc.slug && !bySlug.has(doc.slug)) bySlug.set(doc.slug, doc)
    if (doc.name && !byName.has(doc.name)) byName.set(doc.name, doc)
  }

  let created = 0
  let updated = 0
  const tx = client.transaction()

  for (const p of QBS) {
    const slug = slugify(p.name)
    const payload = {
      _type: 'player',
      name: p.name,
      aliases: buildAliases(p.name),
      slug: { _type: 'slug', current: slug },
      team: p.team,
      position: 'QB',
      bio: buildBio(p),
      active: true,
    }

    const existingDoc = bySlug.get(slug) || byName.get(p.name)
    if (existingDoc?._id) {
      tx.patch(existingDoc._id, (patch) => patch.set(payload))
      updated += 1
    } else {
      tx.create({
        _id: `player-${slug}`,
        ...payload,
      })
      created += 1
    }
  }

  await tx.commit({ autoGenerateArrayKeys: true })

  const verify = await client.fetch(
    `*[_type == "player" && name in $names]|order(name asc){ name, team, "slug": slug.current }`,
    { names }
  )

  console.log(`Done. ${created} created, ${updated} updated.`)
  console.log(`Verified ${verify.length}/${QBS.length} QB player docs now present.`)
  if (verify.length !== QBS.length) {
    const existingNames = new Set(verify.map((v) => v.name))
    const missing = names.filter((name) => !existingNames.has(name))
    console.log('Missing:', missing.join(', '))
  }
}

main().catch((err) => {
  console.error('Failed to seed QB players:', err)
  process.exit(1)
})

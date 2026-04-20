import fs from 'node:fs'
import {createClient} from 'next-sanity'

function loadEnvFile(path) {
  const contents = fs.readFileSync(path, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match) continue
    const [, key, value] = match
    process.env[key] = value
  }
}

loadEnvFile('.env.local')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const cdnClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01',
  useCdn: true,
})

const title = 'What Is the NFL Practice Squad? How Elevations, Eligibility and Roster Rules Work'
const homepageTitle = 'How the NFL Practice Squad Works'
const slug = 'what-is-the-nfl-practice-squad'
const summary =
  'The NFL practice squad is more than a holding area for fringe players. It gives teams a flexible way to develop talent, manage injuries and create short-term gameday depth without constantly reshaping the 53-man roster.'

let keyCounter = 0
const key = () => `k${(++keyCounter).toString(36)}${Math.random().toString(36).slice(2, 8)}`

const span = (text) => ({
  _type: 'span',
  _key: key(),
  text,
  marks: [],
})

const block = (style, text) => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs: [],
  children: [span(text)],
})

const bullet = (text) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  listItem: 'bullet',
  level: 1,
  markDefs: [],
  children: [span(text)],
})

function buildBody() {
  return [
    block(
      'normal',
      'The NFL practice squad sits in the space between the 53-man roster and the open market. It gives teams a place to keep developmental players, preserve depth at thin positions and react quickly when injuries hit during the week.'
    ),
    block(
      'normal',
      "For fans, the practice squad matters because it often explains why a player seems to appear on gameday out of nowhere. For teams, it is one of the league's most important roster-management tools."
    ),

    block('h2', 'What the NFL practice squad is'),
    block(
      'normal',
      'The practice squad is a separate group of players who train with the team but do not count toward the standard 53-man active/inactive roster. Those players help clubs run practices, develop future contributors and keep insurance options in-house if the active roster changes late in the week.'
    ),
    block(
      'normal',
      'A practice squad player is not the same as an active-roster player. He can work with the club and stay in the building, but he is not automatically available for Sunday unless the team takes the extra step to elevate or sign him.'
    ),

    block('h2', 'How big an NFL practice squad is'),
    block(
      'normal',
      "Under the NFL's current structure, teams carry a 16-player practice squad. A club can expand that number to 17 if one of those players qualifies through the International Player Pathway program."
    ),
    block(
      'normal',
      'That extra flexibility matters because teams are constantly balancing injuries, special teams roles, scout-team reps and developmental prospects at the bottom of the roster.'
    ),

    block('h2', 'Who is eligible for the practice squad'),
    block(
      'normal',
      'The NFL’s current eligibility rules are wider than they used to be. The practice squad is no longer just for raw rookies who need a year to develop.'
    ),
    bullet('Players with no accrued seasons can qualify.'),
    bullet('Players with a limited amount of regular-season experience in their lone accrued season can qualify.'),
    bullet('Teams can also reserve a chunk of practice-squad spots for players with more experience, including veterans.'),
    block(
      'normal',
      'The important takeaway is simple: the modern practice squad is a blend of development and emergency depth. Some players are future projects. Others are experienced veterans a team trusts to step in fast.'
    ),

    block('h2', 'How standard elevations work'),
    block(
      'normal',
      "The practice squad becomes especially important late in the week, when teams finalize the roster for gameday. The NFL's standard elevation rules let clubs temporarily move practice-squad players onto the active list without signing them to the full 53-man roster."
    ),
    bullet('A team can elevate one or two practice-squad players for a game.'),
    bullet('Those elevations can expand the gameday roster to 54 or 55 players, but only through the standard elevation process.'),
    bullet('After the game, an elevated player can revert back to the practice squad instead of staying on the active roster.'),
    bullet('A player can only be elevated a limited number of times before the team has to give him a 53-man roster spot to keep using him on gameday.'),
    block(
      'normal',
      'That system gives teams real flexibility. If a linebacker tweaks a hamstring on Friday or a club wants an extra special teams body on Sunday, the practice squad can solve the problem without a permanent roster move.'
    ),

    block('h2', 'Why the practice squad matters so much'),
    block(
      'normal',
      'The practice squad helps teams solve three problems at once: development, depth and week-to-week adaptability. That is why it stays relevant from training camp through the regular season.'
    ),
    bullet('It gives younger players time to learn a scheme without forcing them onto the field too early.'),
    bullet('It lets teams stash position depth behind injury-prone or high-contact spots.'),
    bullet('It creates matchup flexibility when a team wants a temporary extra pass rusher, receiver, tight end or defensive back.'),
    bullet('It gives front offices a low-cost way to keep players in the system instead of losing them immediately after final cuts.'),
    block(
      'normal',
      "In practice, that means a strong practice squad can quietly raise a team's floor over the course of a season. The better a club is at churning the bottom of the roster, the faster it can survive bad injury luck or sudden role changes."
    ),

    block('h2', 'Practice squad vs. 53-man roster'),
    block(
      'normal',
      'The easiest way to think about the difference is this: the 53-man roster is your active inventory, while the practice squad is your reserve shelf.'
    ),
    bullet('53-man roster players are part of the official active/inactive list and can be made available for games.'),
    bullet('Practice-squad players stay with the club, practice with the team and can be elevated or signed when needed.'),
    bullet('Moving a player from the practice squad into the weekly gameday plan is easier than replacing him from outside the building.'),
    block(
      'normal',
      'That convenience is why teams value continuity so much. If a coach trusts a practice-squad player to handle assignments, that player can become the first call when a roster spot opens.'
    ),

    block('h2', 'FAQ'),
    block('h3', 'Are practice squad players on the active roster?'),
    block(
      'normal',
      'No. Practice-squad players stay off the 53-man roster unless a club signs them to it or uses a standard elevation for a game.'
    ),
    block('h3', 'Can veteran players be on the practice squad?'),
    block(
      'normal',
      'Yes. The current rules allow teams to carry a mix of developmental players and experienced veterans on the practice squad.'
    ),
    block('h3', 'Can a team call up two practice squad players in the same week?'),
    block(
      'normal',
      'Yes. Teams can use standard elevations on one or two practice-squad players for a given game, which is why those moves show up so often on late-week transaction reports.'
    ),
    block('h3', 'Does an elevated practice squad player stay on the roster after the game?'),
    block(
      'normal',
      'Not automatically. Under the standard process, the player can revert to the practice squad after the game rather than staying on the 53-man roster.'
    ),
    block('h3', 'Why do fans hear about practice squad elevations every weekend?'),
    block(
      'normal',
      'Because the practice squad is the league’s cleanest short-term roster fix. Teams use it to cover injuries, support special teams and add depth for a specific opponent without making a larger roster move than necessary.'
    ),

    block('h2', 'The bottom line'),
    block(
      'normal',
      'The NFL practice squad is not just a waiting room. It is a live part of roster construction, weekly game planning and long-term player development. If you understand how it works, weekly transaction news starts making a lot more sense.'
    ),
  ]
}

async function main() {
  const existing = await cdnClient.fetch(
    '*[_type == "article" && slug.current == $slug][0]{_id, title, "slug": slug.current}',
    {slug}
  )

  if (existing) {
    console.log(`Existing article found: ${existing.title} (${existing._id})`)
    return
  }

  const now = new Date().toISOString()
  const doc = {
    _id: `drafts.article-nfl-practice-squad-${Date.now()}`,
    _type: 'article',
    format: 'feature',
    title,
    homepageTitle,
    slug: {_type: 'slug', current: slug},
    seo: {
      _type: 'seo',
      autoGenerate: false,
      metaTitle: 'What Is the NFL Practice Squad? Rules and Elevations',
      metaDescription:
        'An evergreen explainer on what the NFL practice squad is, who qualifies, how elevations work and why teams rely on it all season.',
      focusKeyword: 'NFL practice squad',
      additionalKeywords: ['practice squad rules', 'standard elevation', 'NFL roster rules', 'practice squad eligibility'],
      ogTitle: 'What Is the NFL Practice Squad? Rules and Elevations',
      ogDescription:
        'A clear guide to NFL practice squad rules, eligibility, standard elevations and why the system matters every week.',
      noIndex: false,
    },
    author: {_type: 'reference', _ref: '12743c4a-c7e2-4d18-ba79-4b629d78140e'},
    date: now,
    summary,
    category: {_type: 'reference', _ref: '1d7bf305-0631-41af-8a54-76c3d56cd1ad'},
    topicHubs: [
      {_type: 'reference', _key: key(), _ref: 'F7xHg03va2kC20ApZmik6F'},
      {_type: 'reference', _key: key(), _ref: 'F7xHg03va2kC20ApZmikLp'},
    ],
    tagRefs: [
      {_type: 'reference', _key: key(), _ref: 'uuNx9zJ84p1kNNuG6PSaJs'},
      {_type: 'reference', _key: key(), _ref: 'c27ac860-413b-47a4-b30a-b932605a5747'},
      {_type: 'reference', _key: key(), _ref: 'uuNx9zJ84p1kNNuG6PSe0u'},
      {_type: 'reference', _key: key(), _ref: '6XaQaQbjgYcwclRuGWeb03'},
    ],
    published: false,
    body: buildBody(),
  }

  const created = await client.create(doc)
  console.log(`Created draft: ${created._id}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

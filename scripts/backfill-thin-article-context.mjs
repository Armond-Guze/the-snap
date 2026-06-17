#!/usr/bin/env node
// Add targeted context to published pages that are still too thin after the
// broader indexing and editorial-structure backfills. Also patches a few short
// meta descriptions found by the final indexable-content audit.
//
// Default is dry-run. Add --write to commit changes:
//   node scripts/backfill-thin-article-context.mjs
//   node scripts/backfill-thin-article-context.mjs --write

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

if (!projectId || !dataset) {
  console.error('Missing Sanity projectId/dataset in env')
  process.exit(1)
}

if (WRITE && !token) {
  console.error('Missing Sanity write token. Set SANITY_WRITE_TOKEN or run without --write.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

function key() {
  return Math.random().toString(36).slice(2, 14)
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
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

function blockText(block) {
  return compact((block?.children || []).map((child) => child?.text || '').join(' '))
}

function bodyText(blocks) {
  return compact((blocks || []).map(blockText).join(' '))
}

const ADDITIONS = {
  'dolphins-tough-day-during-joint-practice-with-lions-': {
    heading: 'Why the practice matters',
    paragraphs: [
      'Joint practices can be more revealing than preseason snaps because starters get repeated competitive reps without the same game-script limits. For Miami, the concern is not one sloppy period by itself; it is whether the offense can answer quickly when timing, spacing, and protection are challenged by a physical defense.',
      'The next practices matter because the Dolphins need cleaner operation before the regular season pace arrives. If the energy, communication, and early-down rhythm improve, this can stay in the camp-noise category. If the same issues show up again, it becomes a bigger question for an offense built around precision.',
    ],
  },
  'packers-jordan-love-to-get-surgery-on-thumb': {
    heading: 'Why the recovery matters',
    paragraphs: [
      'For Green Bay, the key question is how much practice time Love loses while the offense is still sharpening timing with its receivers. Thumb injuries can affect grip, ball placement, and confidence even after a quarterback is cleared, so the Packers will want to see clean mechanics before treating this as fully behind him.',
      'The situation also puts more attention on the backup reps. If Love misses meaningful preseason work, Green Bay has to balance keeping the offense on schedule with avoiding unnecessary risk for its starter.',
    ],
  },
  'what-the-cowboys-vs-eagles-will-be-like': {
    heading: 'Game context',
    paragraphs: [
      'The opener is also a tone-setter for two teams that are trying to define the NFC East race immediately. Dallas needs the game to be controlled up front, especially after reshaping the defense, while Philadelphia can make the night feel one-sided if its defensive line controls down-and-distance.',
      'That makes the matchup less about one splash play and more about whether the Cowboys can stay out of obvious passing situations. If Prescott gets manageable throws and the run defense holds up, Dallas can keep the game uncomfortable. If not, the Eagles have the kind of roster balance that can turn small mistakes into a long night.',
    ],
  },
  'chiefs-wr-rashee-rice-will-serve-suspension-to-begin-nfl-season': {
    heading: 'Chiefs receiver impact',
    paragraphs: [
      'Kansas City can absorb short-term roster problems better than most teams because of Patrick Mahomes and Andy Reid, but Rice’s absence still changes the early-season target picture. The Chiefs will need other receivers to handle more volume, win underneath, and keep the offense efficient while Rice is away.',
      'The timing also matters for playoff positioning. A six-game absence does not define the Chiefs’ season, but it can affect rhythm, receiver roles, and how much the offense leans on Travis Kelce and the run game before the wide receiver room is whole again.',
    ],
  },
  'eagles-acquiring-wr-john-metchie-iii-from-texans': {
    heading: 'Philadelphia fit',
    paragraphs: [
      'For the Eagles, Metchie profiles more as a depth and competition addition than a move that changes the top of the passing game. Philadelphia already has clear lead options, so his path is likely tied to reliability, route detail, and whether he can give the offense another usable slot or rotational receiver.',
      'The trade also gives the Eagles a longer look at a former Day 2 pick without making a major draft-capital bet. If Metchie earns trust quickly, he can help stabilize the back half of the receiver room. If not, the cost was modest enough for Philadelphia to keep evaluating.',
    ],
  },
  'eagles-landon-dickerson-gives-out-beers-at-practice-': {
    heading: 'Why it still matters',
    paragraphs: [
      'The lighter moment landed because Dickerson is one of the tone-setters for Philadelphia’s offensive line, but the football piece is still the injury timeline. The Eagles can manage a short absence in August, yet every missed rep matters when a starter is recovering and the team is testing its interior depth.',
      'Toth’s preseason work now carries real value. Philadelphia needs him to handle communication, leverage, and combo-block timing well enough that the offense does not have to change its identity if Dickerson needs extra time.',
    ],
  },
  'james-cook-and-bills-agree-to-4-year-48m-contract-extension': {
    heading: 'Why Buffalo made the move',
    paragraphs: [
      'The extension gives Buffalo stability around Josh Allen and rewards a back who has become more than a change-of-pace piece. Cook’s burst, touchdown production, and receiving ability give the Bills a way to stay balanced without taking the ball out of Allen’s hands in high-leverage moments.',
      'It also signals how the Bills view their offensive identity. Paying a running back at this level only makes sense if the team believes he can help protect leads, punish lighter boxes, and keep the offense from becoming too dependent on Allen creating every explosive play.',
    ],
  },
  'browns-rookie-qb-shedeur-sanders-strains-oblique': {
    heading: 'Quarterback room impact',
    paragraphs: [
      'For Sanders, the biggest cost is timing. Rookie quarterbacks need practice volume to build chemistry, speed up reads, and show coaches how they respond from one installation period to the next. Even a short absence can slow that evaluation when the depth chart is already unsettled.',
      'The Browns now have to manage two things at once: protecting Sanders physically and keeping the quarterback competition functional. If he returns quickly, this may be a temporary pause. If the oblique lingers, Cleveland’s preseason plan becomes much harder to evaluate cleanly.',
    ],
  },
  'shedeur-sanders-shines-in-debut': {
    heading: 'What comes next',
    paragraphs: [
      'The next step for Sanders is proving the debut can carry over once defenses adjust and the Browns expand what they ask him to handle. Preseason poise is encouraging, but coaches will be watching protection calls, timing against pressure, and whether he avoids forcing throws after early success.',
      'That is why the performance matters even if it does not settle the depth chart by itself. Sanders gave Cleveland a reason to keep giving him meaningful reps, and every clean drive makes the quarterback conversation more interesting.',
    ],
  },
  'jaxson-dart-impresses-in-start': {
    heading: 'What the Giants can take from it',
    paragraphs: [
      'For the Giants, the encouraging part is less about the box score and more about how Dart handled the structure of the offense. Young quarterbacks can flash on one throw, but sustained drives require timing, protection awareness, and the ability to move to the next read without letting the play break down.',
      'The next test is consistency. If Dart keeps stacking clean preseason reps, New York can bring him along with more confidence while still controlling expectations around a rookie quarterback.',
    ],
  },
  'what-we-learned-from-bills-dolphins-on-thursday-night-football': {
    heading: 'AFC East takeaway',
    paragraphs: [
      'The larger takeaway is that Buffalo still has the late-game answers Miami is searching for. Division games often come down to a few possessions, and the Bills were more composed when the margin tightened.',
      'For Miami, the performance was close enough to be frustrating rather than hopeless. The Dolphins showed they could pressure Buffalo and create stress, but until they finish those opportunities, the gap between a competitive night and a season-changing win remains wide.',
    ],
  },
  'cowboys-sign-javonte-williams-to-3-year-24m-extension': {
    heading: 'What it says about Dallas',
    paragraphs: [
      'The deal shows Dallas is willing to pay for offensive stability when the fit is clear. Williams gives the Cowboys a physical early-down runner who can also stay involved in the passing game, which matters for an offense trying to avoid predictable personnel groupings.',
      'It also gives Dallas one less major offensive question entering the offseason. With Williams under contract, the front office can focus on the passing game, line depth, and how to keep the offense efficient around Dak Prescott.',
    ],
  },
  'will-the-49ers-trade-mac-jones-john-lynch-sets-a-high-bar': {
    heading: 'Why the price is high',
    paragraphs: [
      'The 49ers are treating Jones like insurance for a championship-caliber roster, not just a spare quarterback. That distinction matters because a backup who can keep the offense organized may be worth more to San Francisco than a mid-level pick would be.',
      'Any interested team would have to beat that internal value. Unless the offer gives the 49ers a clear roster-building win, keeping Jones is the cleaner move for a team that expects to contend and cannot afford to let one injury derail the season.',
    ],
  },
}

const RANKING_ADDITIONS = {
  'nfl-s-most-suprising-teams-of-2025': {
    heading: 'What makes a surprise team',
    paragraphs: [
      'A surprise team is not just a club that wins a few unexpected games. The more useful test is whether the improvement looks repeatable: better quarterback play, cleaner coaching, healthier core players, and younger contributors turning into weekly starters.',
      'That matters because early-season momentum can be noisy. Turnover luck, opponent injuries, and a soft schedule can make a team look better than it is. The teams that hold their place on this list are the ones whose improvement shows up in stable areas, like line play, third-down execution, defensive communication, and late-game poise.',
      'The ranking should be read as a sustainability check. If a team is winning in ways that travel, it deserves to climb. If the start is built on narrow escapes or one unsustainable matchup edge, the surprise may fade once the schedule tightens.',
    ],
  },
  'top-10-nfl-offenses-for-2025-season': {
    heading: 'What separates the top offenses',
    paragraphs: [
      'The best NFL offenses are not built on one star or one concept. They usually combine quarterback efficiency, offensive line stability, explosive-play threats, red-zone answers, and a play-caller who can punish defensive adjustments before the game gets away from them.',
      'That is why this ranking weighs more than raw yardage. A unit can pile up yards while chasing points, but the truly dangerous offenses create easy answers on early downs, protect the quarterback when defenses know a pass is coming, and turn field position into touchdowns instead of long drives that stall.',
      'Balance also matters. Not every elite offense has to be run-heavy, but every elite offense needs a credible counterpunch. If defenses can take away the first option and force uncomfortable football, the unit has not fully separated from the pack.',
    ],
  },
  'ranking-all-eight-nfl-divisions-entering-2025-season': {
    heading: 'What drives the division ranking',
    paragraphs: [
      'Division strength starts with quarterbacks, but it does not end there. The deepest groups have multiple teams with realistic playoff paths, enough coaching stability to survive rough stretches, and rosters that do not collapse if one position group gets exposed.',
      'The bottom of each division matters almost as much as the top. A division with one powerhouse and three rebuilding teams is easier to navigate than a division where every road game can turn into a coin flip. That week-to-week pressure affects seeding, tiebreakers, and how much margin contenders carry into December.',
      'This ranking is built around total resistance. The stronger divisions force teams to win different kinds of games: shootouts, defensive slogs, weather games, and rivalry spots where familiarity strips away easy advantages.',
    ],
  },
}

const META_DESCRIPTIONS = {
  'nfl-betting-odds-explained-spreads-moneylines-totals-and-more':
    'Learn how NFL betting odds work, including point spreads, moneylines, totals, vig, implied probability, line movement, and common bet types.',
  '2026-nfl-mock-draft-first-round-board-with-two-key-swaps':
    'A complete 2026 NFL mock draft with a first-round board, two projected trades, team fits, and prospect notes for all 32 picks.',
  'seahawks-vs-patriots-four-must-know-storylines-for-super-bowl-lx':
    "Preview Seahawks vs. Patriots in Super Bowl LX with four key storylines, including Drake Maye, Sam Darnold, pass protection, and Seattle's defense.",
  'will-the-49ers-trade-mac-jones-john-lynch-sets-a-high-bar':
    'John Lynch says the 49ers value Mac Jones as quarterback insurance and would only consider a trade if another team offers a strong return.',
  'nfl-power-rankings-2025-super-bowl':
    'Complete 2025 Super Bowl power rankings with team-by-team playoff context, biggest risers and fallers, and the final NFL title-picture hierarchy.',
}

async function fetchDocs() {
  const slugs = [...new Set([...Object.keys(ADDITIONS), ...Object.keys(RANKING_ADDITIONS), ...Object.keys(META_DESCRIPTIONS)])]

  return client.fetch(
    `*[
      _type in ["article", "rankings"] &&
      published == true &&
      slug.current in $slugs &&
      !(_id in path("drafts.**")) &&
      (!defined(seo.noIndex) || seo.noIndex == false)
    ]{
      _id,
      _type,
      title,
      "slug": slug.current,
      seo,
      body[]{..., children[]{...}}
    } | order(slug.current asc)`,
    { slugs }
  )
}

async function main() {
  console.log(`Starting thin article context backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : '[WRITE]'}`)

  const docs = await fetchDocs()
  const docsBySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  let changed = 0
  let skipped = 0

  for (const [slug, addition] of Object.entries(ADDITIONS)) {
    const doc = docsBySlug.get(slug)
    if (!doc) {
      skipped++
      console.log(`\nSkipping missing or non-indexable article ${slug}`)
      continue
    }

    const blocks = Array.isArray(doc.body) ? doc.body : []
    const text = bodyText(blocks)
    const marker = addition.paragraphs[0]

    if (text.includes(marker)) {
      skipped++
      continue
    }

    const nextBody = [
      ...blocks,
      textBlock(addition.heading, 'h2'),
      ...addition.paragraphs.map((paragraph) => textBlock(paragraph)),
    ]

    changed++
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${slug}`)
    console.log(`  ${doc.title}`)
    console.log(`  chars: ${text.length} -> ${bodyText(nextBody).length}`)
    console.log(`  adding: ${addition.heading}`)

    if (!DRY_RUN) {
      await client.patch(doc._id).set({ body: nextBody }).commit({ autoGenerateArrayKeys: true })
    }
  }

  for (const [slug, addition] of Object.entries(RANKING_ADDITIONS)) {
    const doc = docsBySlug.get(slug)
    if (!doc) {
      skipped++
      console.log(`\nSkipping missing or non-indexable ranking ${slug}`)
      continue
    }

    const blocks = Array.isArray(doc.body) ? doc.body : []
    const text = bodyText(blocks)
    const marker = addition.paragraphs[0]

    if (text.includes(marker)) {
      skipped++
      continue
    }

    const nextBody = [
      ...blocks,
      textBlock(addition.heading, 'h2'),
      ...addition.paragraphs.map((paragraph) => textBlock(paragraph)),
    ]

    changed++
    console.log(`\n${DRY_RUN ? 'Would patch' : 'Patching'} ${slug}`)
    console.log(`  ${doc.title}`)
    console.log(`  chars: ${text.length} -> ${bodyText(nextBody).length}`)
    console.log(`  adding: ${addition.heading}`)

    if (!DRY_RUN) {
      await client.patch(doc._id).set({ body: nextBody }).commit({ autoGenerateArrayKeys: true })
    }
  }

  for (const [slug, metaDescription] of Object.entries(META_DESCRIPTIONS)) {
    const doc = docsBySlug.get(slug)
    if (!doc) {
      skipped++
      console.log(`\nSkipping missing or non-indexable meta patch ${slug}`)
      continue
    }

    const current = compact(doc.seo?.metaDescription)
    if (current === metaDescription) {
      skipped++
      continue
    }

    changed++
    console.log(`\n${DRY_RUN ? 'Would patch meta' : 'Patching meta'} ${slug}`)
    console.log(`  ${doc.title}`)
    console.log(`  metaDescription: ${current.length} -> ${metaDescription.length}`)

    if (!DRY_RUN) {
      await client.patch(doc._id).set({ seo: { ...(doc.seo || {}), metaDescription } }).commit()
    }
  }

  console.log(`\nDone. ${changed} ${DRY_RUN ? 'would change' : 'changed'}, ${skipped} skipped.`)
  if (DRY_RUN && token) console.log('Run again with --write to apply thin article context updates.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

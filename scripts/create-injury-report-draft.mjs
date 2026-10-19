#!/usr/bin/env node

// Creates ONE unpublished draft article in Sanity: "How to Read the NFL Injury Report for Fantasy and Betting".
//
//   node scripts/create-injury-report-draft.mjs            -> dry run (reads Sanity, prints what it would create)
//   node scripts/create-injury-report-draft.mjs --apply    -> creates the draft (needs a Sanity write token)
//
// Safety: the document id starts with "drafts.", `published` is false, nothing is published, and
// createIfNotExists never overwrites an existing draft. The four human review checkboxes stay false.
// References (author, category, tags, topic hub, internal link plan) are looked up by slug at run time.

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token =
  process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const apply = process.argv.includes('--apply')
const offline = process.argv.includes('--offline')

const TITLE = 'How to Read the NFL Injury Report for Fantasy and Betting'
const SLUG = 'how-to-read-the-nfl-injury-report-for-fantasy-and-betting'
const DRAFT_ID = 'drafts.injury-report-explainer-fantasy-betting'

// Slugs of existing Snap pages used for internal links (verify they are live and indexable).
const ODDS_GUIDE = 'nfl-betting-odds-explained-spreads-moneylines-totals-and-more'
const IMPLIED_TOTALS = 'how-to-use-vegas-implied-team-totals-a-2026-fantasy-and-betting-playbook'
const STRENGTH_OF_SCHEDULE = '2026-nfl-strength-of-schedule-easiest-hardest-win-totals'

const TAG_SLUGS = [
  'injury-report',
  'fantasy-football',
  'fantasy-strategy',
  'nfl-betting',
  'betting-odds',
  'line-movement', // optional: only attached if you imported the new tag
]

// ---- block helpers -------------------------------------------------------------------------

function block(key, segments, {style = 'normal', listItem} = {}) {
  const parts = typeof segments === 'string' ? [{text: segments}] : segments
  const markDefs = []
  const children = parts.map((part, index) => {
    const marks = []
    if (part.href) {
      const markKey = `${key}-link-${index}`
      markDefs.push({_type: 'link', _key: markKey, href: part.href})
      marks.push(markKey)
    }
    if (part.strong) marks.push('strong')
    return {_type: 'span', _key: `${key}-span-${index}`, marks, text: part.text}
  })
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs,
    ...(listItem ? {listItem, level: 1} : {}),
    children,
  }
}

const h2 = (key, text) => block(key, text, {style: 'h2'})
const h3 = (key, text) => block(key, text, {style: 'h3'})
const bullet = (key, segments) => block(key, segments, {listItem: 'bullet'})

// NOTE: replace this with the exact NFL Football Operations injury-report policy page after you verify it.
const NFL_OPERATIONS_URL = 'https://operations.nfl.com/'

function buildBody() {
  return [
    block('intro-1', [
      {
        text: 'The NFL injury report tells you two things about every listed player: how much he practiced and whether he is expected to play. Read both, and you can set your fantasy lineup with confidence and understand why a betting line moved. This guide shows how.',
      },
    ]),
    block('intro-2', 'Betting is for adults 21+ where legal. Nothing here is a guarantee of any result.'),

    h2('statuses-heading', 'What the three game statuses mean'),
    bullet('status-out', [{text: 'Out: ', strong: true}, {text: 'The player will not play. Bench him and start the replacement.'}]),
    bullet('status-doubtful', [
      {text: 'Doubtful: ', strong: true},
      {text: 'The player is unlikely to play. Plan as if he is out, and have a backup ready.'},
    ]),
    bullet('status-questionable', [
      {text: 'Questionable: ', strong: true},
      {text: 'It is genuinely uncertain. The designation does not carry a fixed percentage, so do not treat it as a coin flip.'},
    ]),
    block('status-note', [
      {text: 'The league publishes the rules behind these designations on its '},
      {text: 'Football Operations site', href: NFL_OPERATIONS_URL},
      {text: '. (Verify before publishing: the old "Probable" label was retired in 2016.)'},
    ]),

    h2('practice-heading', 'What practice participation tells you'),
    block('practice-1', [
      {
        text: 'Each day lists a practice level: Did Not Participate (DNP), Limited, or Full. The trend across Wednesday, Thursday and Friday matters more than any single day.',
      },
    ]),
    block('practice-2', [
      {
        text: 'A player moving from Limited to Full is a good sign. A player who drops from Full to Limited or DNP deserves a backup plan.',
      },
    ]),

    h2('actions-heading', 'What to do with each status'),
    bullet('act-out', [
      {text: 'Out: ', strong: true},
      {text: 'Fantasy: bench him and start the backup. Betting: the line already reflects it, so check how the backup changes the game.'},
    ]),
    bullet('act-doubtful', [
      {text: 'Doubtful: ', strong: true},
      {text: 'Fantasy: plan as if he is out. Betting: same as Out.'},
    ]),
    bullet('act-q-full', [
      {text: 'Questionable, full practice Friday: ', strong: true},
      {text: 'Fantasy: probably fine, but still check inactives. Betting: little extra signal.'},
    ]),
    bullet('act-q-limited', [
      {text: 'Questionable, limited or DNP Friday: ', strong: true},
      {text: 'Fantasy: real risk, so have a fallback ready. Betting: watch for late line movement.'},
    ]),
    bullet('act-cleared', [
      {text: 'Cleared (no designation): ', strong: true},
      {text: 'Fantasy: start as normal. Betting: no signal.'},
    ]),

    h2('lock-heading', 'When to lock your lineup'),
    block('lock-1', [
      {
        text: 'Teams publish practice reports during the week, and the league\'s inactive list comes out about 90 minutes before kickoff. (Verify before publishing.)',
      },
    ]),
    block('lock-2', [
      {
        text: 'If a decision depends on a Questionable player in an early Sunday game, put a later-kickoff player in your flex spot. That keeps a late swap available. See our ',
      },
      {text: 'fantasy coverage', href: '/fantasy'},
      {text: ' for weekly lineup help.'},
    ]),

    h2('lines-heading', 'How injuries move the betting line'),
    block('lines-1', [
      {text: 'A starter\'s absence moves the point spread by how much the market thinks the starter was worth. Here is a hypothetical, using the formulas from our '},
      {text: 'betting odds guide', href: `/articles/${ODDS_GUIDE}`},
      {text: '.'},
    ]),
    bullet('lines-2', [
      {
        text: 'Team A is -6.5 with a total of 47.5, so the expected scores are Team A (47.5 + 6.5) / 2 = 27.0 and Team B (47.5 - 6.5) / 2 = 20.5.',
      },
    ]),
    bullet('lines-3', [
      {
        text: 'Team A\'s quarterback is ruled out, and the line moves to -2.5 with the total unchanged. Now Team A is (47.5 + 2.5) / 2 = 25.0 and Team B is 22.5.',
      },
    ]),
    bullet('lines-4', [
      {text: 'The market is saying that quarterback was worth about 4 points, and Team A\'s expected scoring dropped by 2.0.'},
    ]),
    block('lines-5', [
      {text: 'That shift tells you which fantasy players to downgrade. For more on this, read how to use '},
      {text: 'implied team totals', href: `/articles/${IMPLIED_TOTALS}`},
      {text: ' for fantasy and betting.'},
    ]),

    h2('checklist-heading', 'A Friday checklist'),
    bullet('check-1', 'Step 1: Check Friday\'s practice report for every Questionable player.'),
    bullet('check-2', 'Step 2: Compare it with Wednesday and Thursday for the trend.'),
    bullet('check-3', 'Step 3: Note each player\'s kickoff time and choose a flex player in a later game.'),
    bullet('check-4', 'Step 4: Check whether the spread or total moved since Monday.'),
    bullet('check-5', 'Step 5: Re-check inactives about 90 minutes before kickoff.'),

    h2('faq-heading', 'Frequently asked questions'),
    h3('faq-1-q', 'Is Questionable 50/50?'),
    block('faq-1-a', 'No. It means uncertain, with no fixed probability.'),
    h3('faq-2-q', 'What does DNP mean?'),
    block('faq-2-a', 'Did Not Participate. The player did not practice that day.'),
    h3('faq-3-q', 'Why does a limited practice matter?'),
    block('faq-3-a', 'It shows the player is still being managed, so the risk of missing the game is higher.'),

    block('closing', [
      {text: 'For more, see our '},
      {text: 'betting guides', href: '/betting'},
      {text: '. If gambling is a problem, call 1-800-GAMBLER.'},
    ]),
  ]
}

// Same counting rules as the article schema's publish gate (sanity/schemaTypes/article.ts).
function inspectBody(blocks) {
  let words = 0
  let internal = 0
  let external = 0
  for (const b of blocks) {
    if (b._type === 'block') {
      words += b.children
        .map((c) => c.text)
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length
    }
    for (const mark of b.markDefs || []) {
      if (mark._type !== 'link' || !mark.href) continue
      if (mark.href.startsWith('/')) internal += 1
      else {
        try {
          const host = new URL(mark.href).hostname.replace(/^www\./, '').toLowerCase()
          if (host === 'thegamesnap.com') internal += 1
          else external += 1
        } catch {
          // ignore malformed
        }
      }
    }
  }
  return {words, internal, external}
}

// ---- main ----------------------------------------------------------------------------------

const body = buildBody()
const stats = inspectBody(body)
console.log(`Body: ${body.length} blocks, ~${stats.words} words, ${stats.internal} internal links, ${stats.external} external source link(s).`)
if (stats.internal < 2 || stats.external < 1) throw new Error('Body does not meet the publish gate (2 internal links + 1 external source).')
if (offline) process.exit(0)

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is missing (check .env.local)')
if (apply && !token) throw new Error('A Sanity write token is required for --apply (SANITY_WRITE_TOKEN in .env.local)')

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})
const ref = (id, key) => ({_type: 'reference', _ref: id, ...(key ? {_key: key} : {})})

const existing = await client.fetch(
  `count(*[_type in ["article","rankings","headline"] && (slug.current == $slug || _id in [$draftId, $publishedId])])`,
  {slug: SLUG, draftId: DRAFT_ID, publishedId: DRAFT_ID.replace(/^drafts\./, '')},
)
if (existing > 0) throw new Error('An article with this slug or id already exists. Nothing was changed.')

const [author, category, tags, hubs, linkTargets] = await Promise.all([
  client.fetch(`*[_type == "author"] | order(_createdAt asc)[0]{_id, name}`),
  client.fetch(
    `*[_type == "category" && (slug.current in ["fantasy","fantasy-football","betting"] || title match "*antasy*")][0]{_id, title}`,
  ),
  client.fetch(`*[_type == "advancedTag" && slug.current in $slugs]{_id, title, "slug": slug.current}`, {slugs: TAG_SLUGS}),
  client.fetch(`*[_type == "topicHub" && slug.current in ["nfl-betting","fantasy-football"]]{_id, title, "slug": slug.current}`),
  client.fetch(`*[_type == "article" && slug.current in $slugs]{_id, title, "slug": slug.current}`, {
    slugs: [ODDS_GUIDE, IMPLIED_TOTALS, STRENGTH_OF_SCHEDULE],
  }),
])

const linkPlan = [...linkTargets.map((a) => ref(a._id, `plan-${a.slug.slice(0, 24)}`)), ...hubs.filter((h) => h.slug === 'nfl-betting').map((h) => ref(h._id, 'plan-betting-hub'))]

const doc = {
  _id: DRAFT_ID,
  _type: 'article',
  format: 'feature',
  title: TITLE,
  homepageTitle: 'NFL Injury Report, Explained',
  slug: {_type: 'slug', current: SLUG},
  summary:
    'What Out, Doubtful and Questionable mean, how practice reports signal risk, and how injuries move betting lines and fantasy lineups.',
  date: new Date().toISOString(),
  published: false,
  ...(author ? {author: ref(author._id)} : {}),
  ...(category ? {category: ref(category._id)} : {}),
  ...(hubs.length ? {topicHubs: hubs.map((h) => ref(h._id, `hub-${h.slug}`))} : {}),
  tagRefs: tags.slice(0, 6).map((t) => ref(t._id, `tag-${t.slug}`)),
  editorialBrief: {
    _type: 'editorialBrief',
    targetQuery: 'how to read the nfl injury report',
    searchIntent: 'explainer',
    readerPromise:
      'Read any injury report and know what to do with your lineup and what a line move means.',
    originalValue:
      'A what-to-do guide for each status, a worked example of how a key injury changes a game\'s expected scores, and a Friday checklist.',
    sources: [
      {
        _type: 'editorialSource',
        _key: 'source-nfl-operations',
        label: 'NFL Football Operations: injury report policy',
        url: NFL_OPERATIONS_URL,
        sourceType: 'primary',
        note: 'Game-status designations and practice-participation levels. Replace with the exact policy page URL after verifying.',
      },
    ],
    internalLinkPlan: linkPlan,
    overlapChecked: false,
    humanReviewed: false,
    factChecked: false,
    imageRightsConfirmed: false,
  },
  body,
}

console.log('\nResolved references:')
console.log(`  author:    ${author ? author.name : 'NOT FOUND (set it in Studio)'}`)
console.log(`  category:  ${category ? category.title : 'NOT FOUND (pick one in Studio)'}`)
console.log(`  topic hubs: ${hubs.map((h) => h.title).join(', ') || 'NONE FOUND'}`)
console.log(`  tags:      ${tags.map((t) => t.title).join(', ') || 'NONE FOUND (import the tag seed first)'}`)
const missingTags = TAG_SLUGS.filter((s) => !tags.some((t) => t.slug === s))
if (missingTags.length) console.log(`  missing tag slugs: ${missingTags.join(', ')}`)
console.log(`  link plan: ${linkPlan.length} reference(s) (need at least 2)`)
const missingLinks = [ODDS_GUIDE, IMPLIED_TOTALS, STRENGTH_OF_SCHEDULE].filter((s) => !linkTargets.some((a) => a.slug === s))
if (missingLinks.length) console.log(`  linked articles not found: ${missingLinks.join(', ')}`)

if (!apply) {
  console.log('\nDry run only. Nothing was written. Run again with --apply to create the draft.')
  process.exit(0)
}

await client.createIfNotExists(doc)
console.log(`\nCreated unpublished draft ${DRAFT_ID}. Open it in Studio: /studio -> Articles -> drafts.`)
console.log('Still to do in Studio: cover image + alt text, tick the four review boxes, verify the NFL source URL, then publish.')

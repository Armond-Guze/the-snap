#!/usr/bin/env node

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const applyChanges = process.argv.includes('--apply')

const articleId = 'bbecca6c-2a15-444e-a439-5320cccf64ce'
const articleSlug = '2026-27-nfl-mvp-odds-josh-allen-and-lamar-jackson-open-as-early-favorites'
const oddsSourceUrl = 'https://sports.betmgm.com/en/blog/nfl/mvp-race-predictions-current-favorites-bm16/'
const helpUrl = 'https://www.ncpgambling.org/responsible-gambling/'

const teamIds = [
  ['b42582da-30ab-44c2-ab2d-2950a6065a2a', 'buffalo-bills'],
  ['9a832c71-37db-48d0-a362-f6b15e139db4', 'baltimore-ravens'],
  ['3e966a4e-cd84-4457-b062-f3b87e45208d', 'los-angeles-chargers'],
  ['9c9528e6-d448-47b5-8e42-3634071fe879', 'new-england-patriots'],
  ['7367819e-a268-4a0b-a3f6-bb9827d0fceb', 'cincinnati-bengals'],
  ['96231b36-6f4f-48c6-a459-ebd3828ecec7', 'kansas-city-chiefs'],
]

const playerIds = [
  ['95204015-7f60-47ba-a811-dd3eda6ec9cf', 'josh-allen'],
  ['player-lamar-jackson', 'lamar-jackson'],
  ['player-justin-herbert', 'justin-herbert'],
  ['c2473b76-cf85-4ccb-acc1-a22752e92e49', 'drake-maye'],
  ['player-joe-burrow', 'joe-burrow'],
  ['53bfa557-78e9-431c-b461-93eeb95008f6', 'patrick-mahomes'],
]

const tagIds = [
  ['b9bbec81-e0ae-4bcb-a362-cd2f100cc88f', 'nfl-betting'],
  ['b8bfb1e2-9554-4a62-9d5e-215269cc5e81', 'betting-odds'],
  ['9395bcb2-97ab-4fe8-bf1d-1b63354b1262', 'nfl-futures'],
  ['2585ba75-54d3-4b42-ab74-3d2a1e1a14fb', 'quarterbacks'],
]

const odds = [
  ['Josh Allen', 'BUF', '+600'],
  ['Lamar Jackson', 'BAL', '+700'],
  ['Justin Herbert', 'LAC', '+900'],
  ['Drake Maye', 'NE', '+1000'],
  ['Joe Burrow', 'CIN', '+1000'],
  ['Patrick Mahomes', 'KC', '+1000'],
  ['Caleb Williams', 'CHI', '+1200'],
  ['Dak Prescott', 'DAL', '+1200'],
  ['Matthew Stafford', 'LAR', '+1400'],
  ['Jordan Love', 'GB', '+1600'],
  ['Brock Purdy', 'SF', '+2000'],
  ['Jayden Daniels', 'WAS', '+2000'],
  ['Trevor Lawrence', 'JAC', '+2000'],
  ['Sam Darnold', 'SEA', '+2500'],
  ['Bo Nix', 'DEN', '+3000'],
  ['Jalen Hurts', 'PHI', '+3500'],
  ['Jared Goff', 'DET', '+4000'],
  ['Baker Mayfield', 'TB', '+5000'],
  ['Jaxson Dart', 'NYG', '+5000'],
  ['Kyler Murray', '—', '+5000'],
  ['C.J. Stroud', 'HOU', '+6600'],
  ['Cam Ward', 'TEN', '+6600'],
  ['Bijan Robinson', 'ATL', '+8000'],
  ['Daniel Jones', 'IND', '+8000'],
  ['Jahmyr Gibbs', 'DET', '+10000'],
  ['Puka Nacua', 'LAR', '+10000'],
  ['Tyler Shough', 'NO', '+10000'],
  ['Myles Garrett', 'LAR', '+10000'],
  ['Bryce Young', 'CAR', '+12500'],
  ["Ja'Marr Chase", 'CIN', '+12500'],
]

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required')
if (applyChanges && !token) throw new Error('A Sanity write token is required with --apply')

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})

function textBlock(key, text, style = 'normal', options = {}) {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    ...(options.listItem ? {listItem: options.listItem, level: options.level || 1} : {}),
    children: [{
      _type: 'span',
      _key: `${key}-text`,
      marks: options.strong ? ['strong'] : [],
      text,
    }],
  }
}

function linkedBlock(key, segments) {
  const markDefs = segments.flatMap((segment, index) => segment.href ? [{
    _type: 'link',
    _key: `${key}-link-${index}`,
    href: segment.href,
  }] : [])

  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs,
    children: segments.map((segment, index) => ({
      _type: 'span',
      _key: `${key}-span-${index}`,
      marks: segment.href ? [`${key}-link-${index}`] : segment.strong ? ['strong'] : [],
      text: segment.text,
    })),
  }
}

function oddsTable() {
  return {
    _type: 'dataTable',
    _key: 'mvp-odds-july-16-2026',
    columns: ['Player', 'Team', 'BetMGM odds'],
    rows: odds.map(([player, team, price], index) => ({
      _type: 'dataTableRow',
      _key: `mvp-odds-row-${index + 1}`,
      cells: [player, team, price],
    })),
  }
}

function buildBody() {
  return [
    textBlock(
      'mvp-opening-answer',
      'Josh Allen is the 2026 NFL MVP favorite at +600 in BetMGM\'s July 16 market. Lamar Jackson is next at +700, Justin Herbert is +900, and Drake Maye, Joe Burrow and Patrick Mahomes form the +1000 tier. Those prices make Allen the leader, but they do not make him an overwhelming favorite: +600 represents a 14.3% implied probability before the sportsbook margin.',
    ),
    textBlock(
      'mvp-opening-context',
      'This page tracks the market and explains the case for each tier. It is not a promise that any price will still be available when you read it. NFL futures move with injuries, roster news, preseason performance, betting action and sportsbook risk, so always confirm the current number before making a decision.',
    ),
    textBlock('mvp-current-odds-heading', '2026 NFL MVP odds', 'h2'),
    linkedBlock('mvp-source-note', [
      {text: 'Market snapshot: '},
      {text: 'BetMGM, July 16, 2026', href: oddsSourceUrl},
      {text: '. Odds are listed for comparison and can change at any time. Team abbreviations reflect the source listing; a dash means the source did not display a team.'},
    ]),
    oddsTable(),
    textBlock('mvp-market-read-heading', 'What the MVP market says right now', 'h2'),
    textBlock(
      'mvp-market-read-intro',
      'The board has three distinct groups near the top. Allen and Jackson carry the shortest prices because the market already treats them as established MVP-level candidates. Herbert sits alone at +900, while Maye, Burrow and Mahomes are tied one step behind at +1000. The difference between +600 and +1000 is meaningful, but the entire top tier remains tightly packed for a season-long award.',
    ),
    textBlock(
      'mvp-market-qb-heavy',
      'The market is also making a strong position call. The first 22 listed candidates are quarterbacks; Bijan Robinson is the first non-quarterback at +8000. That does not make a non-quarterback win impossible. It does show how much more team record, passing production and weekly visibility the market expects a quarterback to have in an MVP race.',
    ),
    textBlock('mvp-allen-heading', 'Why Josh Allen is the 2026 NFL MVP favorite', 'h2'),
    textBlock(
      'mvp-allen-case',
      'Allen has the shortest price because his path is easy for the market to recognize: elite quarterback production, high-leverage rushing value and a Buffalo team expected to contend. A voter-friendly season would combine strong Bills results with signature performances in the games that shape the AFC race. At +600, however, bettors are paying for that established ceiling before the season begins.',
    ),
    textBlock(
      'mvp-allen-price',
      'The price matters as much as the player. A +600 ticket returns $600 in profit on a $100 winning stake, while +1000 returns $1,000. Allen can be the most likely winner and still be less attractive at a short number than a credible challenger at a longer one. That is the central tradeoff in every futures market.',
    ),
    textBlock('mvp-lamar-herbert-heading', 'Lamar Jackson and Justin Herbert lead the challengers', 'h2'),
    textBlock(
      'mvp-lamar-case',
      'Jackson at +700 is priced almost alongside Allen. His combination of passing efficiency and rushing impact can create an MVP-caliber statistical profile without requiring the same type of season as a pocket passer. The clearest route is a top-tier Baltimore record and enough passing production to keep the case from being reduced to rushing value alone.',
    ),
    textBlock(
      'mvp-herbert-case',
      'Herbert at +900 is the first candidate whose price implies a 10% probability before margin. The market is betting on a season in which individual production and Chargers wins rise together. His candidacy would need both: volume without a top team result may not be enough, while a strong team season without standout quarterback numbers may split the credit.',
    ),
    textBlock('mvp-plus-1000-heading', 'The +1000 tier: Maye, Burrow and Mahomes', 'h2'),
    textBlock(
      'mvp-maye-case',
      'Maye offers the most dramatic team-improvement story in the top six. That creates upside because a major New England jump would naturally focus attention on its quarterback. It also creates risk: a young passer can play well without the Patriots winning enough games to sustain an MVP campaign.',
    ),
    textBlock(
      'mvp-burrow-case',
      'Burrow has a straightforward statistical route. If Cincinnati stays healthy, wins at a contender level and produces one of the league\'s best passing offenses, his profile can match the award. The preseason question is whether the Bengals can deliver the complete team season that turns elite quarterback numbers into an MVP case.',
    ),
    textBlock(
      'mvp-mahomes-case',
      'Mahomes at +1000 is the familiar ceiling at a longer price than the two favorites. The argument is not complicated: a top Kansas City record plus a return to dominant passing production would put him in the center of the race. The market is offering a larger payout because it is not pricing that outcome as the default entering the season.',
    ),
    textBlock('mvp-middle-tier-heading', 'How to evaluate the middle of the board', 'h2'),
    textBlock(
      'mvp-middle-tier-intro',
      'Caleb Williams and Dak Prescott begin the next tier at +1200, followed by Matthew Stafford at +1400 and Jordan Love at +1600. These prices can look more appealing than the favorite, but a longer price is not automatically better value. Each candidate needs a plausible route to elite production, a strong team record and a narrative that remains his own rather than being shared across the roster.',
    ),
    textBlock('mvp-middle-question-one', 'Can the team realistically contend for a top conference seed?', 'normal', {listItem: 'bullet'}),
    textBlock('mvp-middle-question-two', 'Will the quarterback receive most of the credit if that team exceeds expectations?', 'normal', {listItem: 'bullet'}),
    textBlock('mvp-middle-question-three', 'Is the offense built to produce obvious headline statistics?', 'normal', {listItem: 'bullet'}),
    textBlock('mvp-middle-question-four', 'Does the price compensate for injury, role and team-quality risk?', 'normal', {listItem: 'bullet'}),
    textBlock(
      'mvp-middle-tier-summary',
      'Purdy, Jayden Daniels and Trevor Lawrence at +2000 are useful examples. All three have a conceivable path, but the market needs more uncertainty priced into them than it does with Allen or Jackson. The question is not merely whether one can have a good season. It is whether the player can own the best quarterback-and-team story in the league.',
    ),
    textBlock('mvp-longshot-heading', 'Can a non-quarterback or long shot win MVP?', 'h2'),
    textBlock(
      'mvp-longshot-answer',
      'A long shot can win, but the current prices show the scale of the challenge. Robinson is +8000, while Gibbs, Puka Nacua and Myles Garrett are +10000. A non-quarterback would likely need a historically distinctive season, excellent team results and a quarterback field without one obvious dominant candidate. The large payout reflects how many conditions must align.',
    ),
    textBlock(
      'mvp-longshot-warning',
      'Long odds can create the illusion of low risk because the stake may be small. The probability is also low, and futures money can remain tied up for months. Treat the stake, opportunity cost and chance of losing as part of the price rather than focusing only on the possible payout.',
    ),
    textBlock('mvp-how-to-read-heading', 'How to read NFL MVP odds', 'h2'),
    textBlock(
      'mvp-how-to-read-positive',
      'Every price on this board is positive American odds. The number shows the profit on a $100 winning stake: +600 means $600 profit plus the original $100 returned; +1000 means $1,000 profit plus the stake. You can scale the math to any permitted stake.',
    ),
    textBlock(
      'mvp-implied-probability',
      'To estimate the implied probability of positive American odds, divide 100 by the odds plus 100. Allen at +600 is 100 divided by 700, or 14.3%. Jackson at +700 is 12.5%, Herbert at +900 is 10%, and a +1000 candidate is 9.1%. Those figures include no adjustment for the sportsbook margin, so the full board will add up to more than 100%.',
    ),
    linkedBlock('mvp-betting-guide-link', [
      {text: 'Need the basics first? Use The Snap\'s '},
      {text: 'complete guide to NFL betting odds', href: '/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more'},
      {text: ' for spreads, moneylines, totals, implied probability and line movement.'},
    ]),
    textBlock('mvp-tracking-heading', 'How to track the market without chasing it', 'h2'),
    textBlock(
      'mvp-tracking-intro',
      'A useful MVP tracker records the sportsbook, price and timestamp. Comparing a number from one book in May with a number from another book in July does not prove that one player rose or fell. Use like-for-like snapshots, and separate a change in true expectations from a book simply managing its own exposure.',
    ),
    textBlock('mvp-track-one', 'Record the exact sportsbook and date beside every price.', 'normal', {listItem: 'number'}),
    textBlock('mvp-track-two', 'Compare the same player across legal books available in your location.', 'normal', {listItem: 'number'}),
    textBlock('mvp-track-three', 'Translate prices to implied probability before comparing moves.', 'normal', {listItem: 'number'}),
    textBlock('mvp-track-four', 'Reassess the football case after injuries, role changes and major team news.', 'normal', {listItem: 'number'}),
    textBlock('mvp-track-five', 'Set a fixed budget and never add money simply to recover a losing position.', 'normal', {listItem: 'number'}),
    textBlock('mvp-related-market-heading', 'Related 2026 NFL futures coverage', 'h2'),
    linkedBlock('mvp-related-market-links', [
      {text: 'Compare the player market with The Snap\'s '},
      {text: 'post-draft Super Bowl LXI odds and team rankings', href: '/articles/post-draft-super-bowl-lxi-odds-rankings-where-all-32-teams-stand'},
      {text: '. The team futures board helps show which quarterbacks have the strongest preseason path to the win totals and seeding an MVP campaign usually needs.'},
    ]),
    textBlock('mvp-faq-heading', '2026 NFL MVP odds FAQ', 'h2'),
    textBlock('mvp-faq-favorite-heading', 'Who is favored to win the 2026 NFL MVP?', 'h3'),
    textBlock(
      'mvp-faq-favorite-answer',
      'Josh Allen is the favorite at +600 in BetMGM\'s July 16, 2026 market. Lamar Jackson is second at +700 and Justin Herbert is third at +900. Check the current board before acting because futures odds move throughout the offseason and season.',
    ),
    textBlock('mvp-faq-allen-heading', 'What are Josh Allen\'s 2026 NFL MVP odds?', 'h3'),
    textBlock(
      'mvp-faq-allen-answer',
      'Allen is +600 in this dated BetMGM snapshot. That price implies a 14.3% probability before accounting for the sportsbook margin and would return $600 in profit on a $100 winning stake.',
    ),
    textBlock('mvp-faq-lamar-heading', 'What are Lamar Jackson\'s 2026 NFL MVP odds?', 'h3'),
    textBlock(
      'mvp-faq-lamar-answer',
      'Jackson is +700 in the July 16 BetMGM market. The price implies a 12.5% probability before margin and places him directly behind Allen among the preseason favorites.',
    ),
    textBlock('mvp-faq-when-heading', 'When do NFL MVP odds change?', 'h3'),
    textBlock(
      'mvp-faq-when-answer',
      'Sportsbooks can change futures prices at any time. Injuries, transactions, preseason developments, weekly results and betting action can all move the board. Different books can also post different prices at the same moment.',
    ),
    textBlock('mvp-faq-non-qb-heading', 'Who is the highest-listed non-quarterback?', 'h3'),
    textBlock(
      'mvp-faq-non-qb-answer',
      'Bijan Robinson is the first non-quarterback on this BetMGM snapshot at +8000. Jahmyr Gibbs, Puka Nacua and Myles Garrett are each listed at +10000.',
    ),
    textBlock('mvp-responsible-heading', 'Responsible betting note', 'h2'),
    linkedBlock('mvp-responsible-note', [
      {text: 'This article is for informational and entertainment purposes, not a guarantee of results or financial advice. Bet only where legal, confirm the rules and age requirements in your location, and never risk money you need. If gambling is causing harm, the '},
      {text: 'National Council on Problem Gambling', href: helpUrl},
      {text: ' lists confidential support resources and the National Problem Gambling Helpline at 1-800-MY-RESET.'},
    ]),
  ]
}

function references(items) {
  return items.map(([id, key]) => ({_type: 'reference', _key: key, _ref: id}))
}

function bodyCharacters(body) {
  return body
    .filter((block) => block?._type === 'block')
    .flatMap((block) => block.children || [])
    .map((child) => child?.text || '')
    .join('\n')
    .length
}

function bodyHeadings(body) {
  return body
    .filter((block) => block?._type === 'block' && ['h2', 'h3'].includes(block.style))
    .map((block) => ({style: block.style, text: block.children?.map((child) => child.text).join('')}))
}

async function main() {
  const ids = [articleId, `drafts.${articleId}`]
  const documents = await client.fetch(
    `*[_id in $ids]{_id,_rev,_type,title,homepageTitle,slug,published,dateModified,summary,seo,body,teams,players,tagRefs}`,
    {ids},
  )
  const draft = documents.find((document) => document._id.startsWith('drafts.'))
  if (draft) throw new Error(`A Studio draft exists for ${articleSlug}; refusing to overwrite it`)

  const document = documents.find((candidate) => candidate._id === articleId)
  if (!document || document._type !== 'article' || document.slug?.current !== articleSlug || document.published !== true) {
    throw new Error('MVP odds article guard failed')
  }

  if (document.body?.some((block) => block?._key === 'mvp-odds-july-16-2026')) {
    console.log(JSON.stringify({
      mode: applyChanges ? 'apply' : 'dry-run',
      id: document._id,
      url: `https://thegamesnap.com/articles/${articleSlug}`,
      status: 'already-applied',
      message: 'The July 16 market snapshot is already present; no freshness date or content was changed.',
    }, null, 2))
    return
  }

  const referencedIds = [...teamIds, ...playerIds, ...tagIds].map(([id]) => id)
  const referenceDocuments = await client.fetch(`*[_id in $ids]{_id}`, {ids: referencedIds})
  const foundIds = new Set(referenceDocuments.map((candidate) => candidate._id))
  const missingIds = referencedIds.filter((id) => !foundIds.has(id))
  if (missingIds.length) throw new Error(`Required reference documents are missing: ${missingIds.join(', ')}`)

  const title = '2026 NFL MVP Odds: Josh Allen Leads the Preseason Market'
  const homepageTitle = '2026 NFL MVP Odds'
  const summary = 'Josh Allen leads the 2026 NFL MVP odds at +600, followed by Lamar Jackson and Justin Herbert. See the complete dated market, implied probabilities and contender analysis.'
  const metaDescription = 'See updated 2026 NFL MVP odds, led by Josh Allen, Lamar Jackson and Justin Herbert, plus implied probabilities, contender tiers and market analysis.'
  const seo = {
    _type: 'seo',
    autoGenerate: false,
    metaTitle: '2026 NFL MVP Odds: Favorites & Contenders | The Snap',
    metaDescription,
    focusKeyword: '2026 NFL MVP odds',
    additionalKeywords: [
      'NFL MVP odds',
      'Josh Allen MVP odds',
      'Lamar Jackson MVP odds',
      'NFL MVP favorites',
      '2026 NFL MVP predictions',
    ],
    ogTitle: '2026 NFL MVP Odds: Josh Allen Leads the Market',
    ogDescription: metaDescription,
    noIndex: false,
  }
  const body = buildBody()
  const teams = references(teamIds)
  const players = references(playerIds)
  const tagRefs = references(tagIds)
  const updatedAt = new Date().toISOString()

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    id: document._id,
    url: `https://thegamesnap.com/articles/${articleSlug}`,
    previousTitle: document.title,
    title,
    homepageTitle,
    previousBodyBlocks: document.body?.length || 0,
    bodyBlocks: body.length,
    previousBodyCharacters: bodyCharacters(document.body || []),
    bodyCharacters: bodyCharacters(body),
    oddsRows: odds.length,
    metaTitle: seo.metaTitle,
    metaTitleLength: seo.metaTitle.length,
    metaDescriptionLength: seo.metaDescription.length,
    previousTeamReferences: document.teams?.length || 0,
    teamReferences: teams.length,
    previousPlayerReferences: document.players?.length || 0,
    playerReferences: players.length,
    previousTagReferences: document.tagRefs?.length || 0,
    tagReferences: tagRefs.length,
    dateModified: updatedAt,
    headings: bodyHeadings(body),
  }, null, 2))

  if (!applyChanges) {
    console.log('\nDry run only. Re-run with --apply to commit this guarded patch.')
    return
  }

  await client
    .patch(document._id)
    .ifRevisionId(document._rev)
    .set({title, homepageTitle, summary, body, seo, teams, players, tagRefs, dateModified: updatedAt})
    .commit({autoGenerateArrayKeys: true})

  console.log(`\nMVP odds guide improvements committed at ${updatedAt}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

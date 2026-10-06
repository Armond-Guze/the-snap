#!/usr/bin/env node

// Guarded refresh of "NFL Top 100 of 2026, Nos. 100-91".
// Spec: docs/refresh-diff-top-100-nos-100-91-2026-10-06.md
//
//   node scripts/refresh-top-100-nos-100-91.mjs            dry run (default, no writes)
//   node scripts/refresh-top-100-nos-100-91.mjs --apply    commit the patch
//   node scripts/refresh-top-100-nos-100-91.mjs --verify   read-only: confirm the live doc matches this script
//   --new-title                                            also apply (or verify) the proposed title
//
// Aborts if the live document differs from the backup, or if a draft exists.

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'
import fs from 'node:fs'
import {isDeepStrictEqual} from 'node:util'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const applyChanges = process.argv.includes('--apply')
const useNewTitle = process.argv.includes('--new-title')

const articleId = 'auto-nfl-top-100-players-of-2026-nos-100-91-e713fe5c13'
const expectedSlug = 'nfl-top-100-of-2026-nos-100-91-azeez-al-shaair-debuts-as-montez-sweat-returns'
const backupPath = `docs/backups/${articleId}-2026-10-06.json`
const sourceUrl = 'https://www.nfl.com/news/top-100-players-of-2026-nos-100-91'

const newTitle = 'NFL Top 100 of 2026, Nos. 100–91: Full List and First-Time Entrants'
const summary =
  'Cameron Jordan is No. 100 and Montez Sweat is No. 91 in the player-voted NFL Top 100 of 2026, with at least four first-time entries led by Bryce Young at No. 98.'
const metaTitle = 'NFL Top 100 of 2026 Nos. 100–91: Full List | The Snap'
const metaDescription =
  'All ten players ranked 100 through 91 in the player-voted 2026 NFL Top 100, with teams, positions, first-time entrants and sourced notes.'
const updateNote =
  'Added the full Nos. 100–91 list with ranks, teams, positions and sourced notes; corrected team tags.'

// Published team tag documents (_type == "tag"). Seahawks uses the published id, not the drafts. copy.
const teamIds = [
  '07e26efb-14aa-4329-b6e5-4aa25780a75b', // New Orleans Saints
  '4fe42a6e-9695-480f-b14a-9395a28d6b09', // Indianapolis Colts
  'a8e3ba46-865f-4cd9-b020-1d391486186c', // Carolina Panthers
  '6f0297b7-4ac9-4093-a566-1eb8c4361e75', // Seattle Seahawks
  '19bae949-b340-4188-8861-aaa5247c6f47', // New York Jets
  '96231b36-6f4f-48c6-a459-ebd3828ecec7', // Kansas City Chiefs
  'bb37c905-5fae-425d-8d64-81c8c7c6ff74', // Cleveland Browns
  '196a9288-569d-4e72-b351-6f6ec4f1db5c', // Houston Texans
  '00f44d40-4c71-450e-bbaa-40916770e3d8', // Chicago Bears
]
const playerIds = ['player-azeez-al-shaair', 'player-bryce-young', 'player-carson-schwesinger']

const siblingIds = {
  firstTime: 'article-nfl-top-100-2026-first-time-candidates',
  nos9081: 'auto-nfl-top-100-players-of-2026-nos-90-81-7ec0f9e059',
  nos8077: 'auto-nfl-top-100-players-of-2026-nos-80-71-3f91eae71c',
}

const tableColumns = ['Rank', 'Player', 'Team', 'Pos.', 'Top 100 status', 'Stat or note']
const tableRows = [
  ['100', 'Cameron Jordan', 'NO', 'DE', '9th appearance', '15th NFL season; 10.5 sacks in 2025, his most since 2021'],
  ['99', 'Quenton Nelson', 'IND', 'G', '4th selection; first since 2022 (No. 28)', 'Pro Bowler in each of his eight NFL seasons'],
  ['98', 'Bryce Young', 'CAR', 'QB', 'First-time entry', 'No. 1 overall pick in 2023; Carolina won the NFC South; career bests in passing yards and touchdowns'],
  ['97', 'Ernest Jones', 'SEA', 'LB', 'First-time entry', 'Seattle’s leading tackler; six interceptions including the postseason; two-time Super Bowl winner'],
  ['96', 'Travis Etienne', 'NO', 'RB', 'First-time entry', 'Career-best 13 scrimmage touchdowns in his final Jaguars season; signed with the Saints this offseason'],
  ['95', 'Demario Davis', 'NYJ', 'OLB', 'Returns after missing 2025', 'Five straight Top 100 years before the gap; 14-year veteran signed by the Jets'],
  ['94', 'Creed Humphrey', 'KC', 'C', 'Down one spot from last year', 'Fourth straight Pro Bowl; second straight All-Pro; 85 straight starts to begin his career'],
  ['93', 'Carson Schwesinger', 'CLE', 'LB', 'Status not stated by NFL.com', '2025 second-round pick; AP Defensive Rookie of the Year; Cleveland’s leading tackler'],
  ['92', 'Azeez Al-Shaair', 'HOU', 'LB', 'First-time entry', 'First Pro Bowl; 100+ tackles for a third time in seven seasons; two interceptions'],
  ['91', 'Montez Sweat', 'CHI', 'DE', 'No. 82 in his 2024 debut', 'Chicago’s sack leader three years running; returned to double-digit sacks'],
]

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required')
if (applyChanges && !token) throw new Error('A Sanity write token is required with --apply')

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})

// Block builders. Segments: {text, href?, ref?}; href -> link mark, ref -> internalLink mark.
function block(key, segments, style = 'normal') {
  const markDefs = []
  const children = segments.map((segment, index) => {
    const marks = []
    if (segment.href || segment.ref) {
      const markKey = `${key}-mark-${index}`
      markDefs.push(
        segment.href
          ? {_type: 'link', _key: markKey, href: segment.href}
          : {_type: 'internalLink', _key: markKey, reference: {_type: 'reference', _ref: segment.ref}},
      )
      marks.push(markKey)
    }
    return {_type: 'span', _key: `${key}-span-${index}`, marks, text: segment.text}
  })
  return {_type: 'block', _key: key, style, markDefs, children}
}

const text = (key, value, style = 'normal') => block(key, [{text: value}], style)

function buildBody() {
  return [
    text(
      't100-intro',
      'Cameron Jordan opens the player-voted 2026 NFL Top 100 reveal at No. 100, and Montez Sweat closes this group at No. 91. NFL.com marks four first-time entrants among the ten: Bryce Young, Ernest Jones, Travis Etienne and Azeez Al-Shaair.',
    ),
    block('t100-vote', [
      {text: 'The list is voted on by the players themselves, according to '},
      {text: 'NFL.com', href: sourceUrl},
      {text: '. The full table is below.'},
    ]),
    text('t100-table-h', 'Nos. 100–91 at a glance', 'h2'),
    {
      _type: 'dataTable',
      _key: 't100-table',
      columns: tableColumns,
      rows: tableRows.map((cells, index) => ({_type: 'dataTableRow', _key: `t100-row-${index + 1}`, cells})),
    },
    text('t100-table-note', 'Ranks, teams, positions and notes are from the NFL.com entries for Nos. 100–91.'),
    text('t100-first-h', 'First-time entrants', 'h2'),
    text(
      't100-first',
      'Young (No. 98), Jones (No. 97), Etienne (No. 96) and Al-Shaair (No. 92) make their Top 100 debuts, per NFL.com. Jones is the first member of the reigning Super Bowl champions on the 2026 list. Etienne’s debut recognizes his final season in Jacksonville before he signed with the Saints. Schwesinger (No. 93), the AP Defensive Rookie of the Year, has no debut label in his entry, so he is not counted here.',
    ),
    text('t100-return-h', 'Returners and repeat selections', 'h2'),
    text(
      't100-return',
      'Jordan makes his ninth appearance at No. 100. Nelson returns for the first time since 2022, when he ranked No. 28. Davis returns after five straight years on the list and an absence in 2025. Humphrey is down one spot from last year, and Sweat ranked No. 82 in his 2024 debut.',
    ),
    text('t100-shows-h', 'What the group shows', 'h2'),
    text(
      't100-shows',
      'By the table’s positions, the group has three linebackers (Jones, Schwesinger, Al-Shaair), two defensive ends (Jordan, Sweat), one outside linebacker (Davis), one guard, one center, one running back and one quarterback. That is six defenders and four offensive players. Two Saints (Jordan, Etienne) appear. This is The Snap’s own tally from the table above.',
    ),
    text('t100-follow-h', 'Keep following the countdown', 'h2'),
    block('t100-follow', [
      {text: 'Next in the reveal: '},
      {text: 'Nos. 90–81', ref: siblingIds.nos9081},
      {text: ' and '},
      {text: 'Nos. 80–77', ref: siblingIds.nos8077},
      {text: '. For who might still be coming, see '},
      {text: '7 first-time candidates who belong on the list', ref: siblingIds.firstTime},
      {text: '.'},
    ]),
    text('t100-source-h', 'Source', 'h2'),
    block('t100-source', [
      {text: 'Source: '},
      {text: 'NFL.com', href: sourceUrl},
    ]),
  ]
}

function buildBrief() {
  return {
    _type: 'editorialBrief',
    targetQuery: 'NFL Top 100 2026 players 100-91',
    searchIntent: 'data',
    readerPromise:
      'See who ranked 100 through 91 in the 2026 NFL Top 100, which players are new, and where they play.',
    originalValue:
      "A single ranked table with team, position and sourced notes, plus a breakdown of first-time entrants, returners and positions that NFL.com's article does not summarize in one place.",
    sources: [
      {
        _type: 'editorialSource',
        _key: 'nfl-com-top-100-100-91',
        label: 'NFL.com: Top 100 Players of 2026, Nos. 100-91',
        url: sourceUrl,
        sourceType: 'secondary',
        note: 'Ranks, teams, positions and stated stats.',
      },
    ],
    internalLinkPlan: Object.values(siblingIds).map((id) => ({
      _type: 'reference',
      _key: `plan-${id.slice(-10)}`,
      _ref: id,
    })),
    overlapChecked: false,
    humanReviewed: false,
    factChecked: false,
    imageRightsConfirmed: false,
  }
}

const ref = (id) => ({_type: 'reference', _ref: id, _key: id.replace(/[^a-zA-Z0-9]/g, '').slice(-12)})

// Read-only post-apply check: compares the live document to what this script builds.
async function verify() {
  const live = await client.fetch('*[_id == $id][0]', {id: articleId})
  if (!live) throw new Error(`Live document ${articleId} not found`)
  const expectedBrief = buildBrief()
  const checks = {
    slugUnchanged: live.slug?.current === expectedSlug,
    summary: live.summary === summary,
    body: isDeepStrictEqual(live.body, buildBody()),
    players: isDeepStrictEqual(live.players, playerIds.map(ref)),
    teams: isDeepStrictEqual(live.teams, teamIds.map(ref)),
    seoMetaTitle: live.seo?.metaTitle === metaTitle,
    seoMetaDescription: live.seo?.metaDescription === metaDescription,
    seoAutoGenerateOff: live.seo?.autoGenerate === false,
    editorialBrief: isDeepStrictEqual(live.editorialBrief, expectedBrief),
    humanConfirmationsFalse: ['overlapChecked', 'humanReviewed', 'factChecked', 'imageRightsConfirmed'].every(
      (field) => live.editorialBrief?.[field] === false,
    ),
    updateNote: live.updateNote === updateNote,
    dateModifiedSet: Boolean(live.dateModified),
    published: live.published === true,
    ...(useNewTitle ? {title: live.title === newTitle} : {}),
  }
  console.log(JSON.stringify({mode: 'verify', id: live._id, rev: live._rev, title: live.title, checks}, null, 2))
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)
  if (failed.length) throw new Error(`VERIFY FAILED: ${failed.join(', ')}`)
  console.log('\nLive document matches the script.')
}

async function main() {
  if (process.argv.includes('--verify')) return verify()

  // 1. Guard: the live document must exactly match the backup.
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  const [live, draft] = await Promise.all([
    client.fetch('*[_id == $id][0]', {id: articleId}),
    client.fetch('*[_id == $id][0]{_id}', {id: `drafts.${articleId}`}),
  ])

  if (!live) throw new Error(`Live document ${articleId} not found`)
  if (draft) throw new Error(`A draft exists (drafts.${articleId}). Publish or discard it first.`)
  if (live.slug?.current !== expectedSlug) throw new Error('Live slug does not match the expected slug')
  if (live._rev !== backup._rev || !isDeepStrictEqual(live, backup)) {
    throw new Error(
      `ABORT: live document changed since the backup (live _rev ${live._rev}, backup _rev ${backup._rev}). ` +
        'Re-backup, review the changes and update the spec before applying.',
    )
  }

  // 2. Build the patch. Slug is intentionally never touched.
  const body = buildBody()
  const dateModified = new Date().toISOString()
  const set = {
    summary,
    body,
    players: playerIds.map(ref),
    teams: teamIds.map(ref),
    seo: {
      ...live.seo,
      autoGenerate: false,
      metaTitle,
      metaDescription,
      ogTitle: metaTitle,
      ogDescription: metaDescription,
      noIndex: false,
    },
    editorialBrief: buildBrief(),
    dateModified,
    updateNote,
  }
  if (useNewTitle) set.title = newTitle

  // 3. Report.
  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    id: live._id,
    rev: live._rev,
    slug: 'unchanged',
    title: useNewTitle ? {from: live.title, to: newTitle} : 'unchanged (pass --new-title to change)',
    homepageTitle: 'unchanged',
    summary: {from: live.summary, to: summary},
    bodyBlocks: {from: live.body?.length || 0, to: body.length},
    dataTableRows: tableRows.length,
    players: {from: live.players?.length || 0, to: playerIds.length},
    teams: {from: live.teams?.length || 0, to: teamIds.length},
    tagRefs: 'unchanged',
    seo: {metaTitle, metaDescription, autoGenerate: false},
    editorialBrief: 'added (all human confirmations false)',
    dateModified,
    updateNote,
    headings: body.filter((b) => b.style === 'h2').map((b) => b.children[0].text),
    needsVerificationMarkers: JSON.stringify(set).match(/Needs verification/g)?.length || 0,
  }, null, 2))

  if (!applyChanges) {
    console.log('\nDry run only. Nothing was written. Re-run with --apply to commit this guarded patch.')
    return
  }

  // 4. Write, pinned to the revision we verified.
  await client
    .patch(live._id)
    .ifRevisionId(live._rev)
    .set(set)
    .commit({autoGenerateArrayKeys: true})

  console.log(`\nTop 100 Nos. 100-91 refresh committed at ${dateModified}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})

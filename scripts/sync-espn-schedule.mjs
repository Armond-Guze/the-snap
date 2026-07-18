#!/usr/bin/env node

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-10-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const applyChanges = process.argv.includes('--apply')
const requestedSeason = process.argv
  .find((argument) => argument.startsWith('--season='))
  ?.split('=')[1]

const now = new Date()
const expectedSeason = now.getUTCMonth() <= 1 ? now.getUTCFullYear() - 1 : now.getUTCFullYear()
const season = Number(requestedSeason || process.env.NFL_SEASON || expectedSeason)

const localAbbreviation = {WSH: 'WAS'}
const networkNames = {
  'ESPN + ABC': 'ESPN/ABC',
  'NFL Net': 'NFLN',
}

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required')
if (!Number.isInteger(season) || season < 2000 || season > 2100) {
  throw new Error(`Invalid season: ${season}`)
}
if (applyChanges && !token) throw new Error('A Sanity write token is required with --apply')

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

function normalizeAbbreviation(value) {
  return localAbbreviation[value] || value
}

function getCompetitor(competition, homeAway) {
  return competition?.competitors?.find((competitor) => competitor.homeAway === homeAway)
}

function getNetwork(competition) {
  const names = (competition?.broadcasts || []).flatMap((broadcast) => broadcast.names || [])
  const joined = names.join(' + ')
  return networkNames[joined] || joined || 'TBD'
}

async function fetchWeek(week) {
  const url = new URL('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')
  url.searchParams.set('week', String(week))
  url.searchParams.set('dates', String(season))
  url.searchParams.set('seasontype', '2')
  url.searchParams.set('limit', '100')

  const response = await fetch(url, {
    headers: {accept: 'application/json'},
  })
  if (!response.ok) throw new Error(`ESPN week ${week} request failed: ${response.status}`)

  const payload = await response.json()
  if (payload.season?.year !== season || payload.week?.number !== week) {
    throw new Error(`ESPN returned the wrong season/week for week ${week}`)
  }

  return (payload.events || []).map((event) => ({event, week}))
}

function mapEvent({event, week}) {
  const competition = event.competitions?.[0]
  const home = getCompetitor(competition, 'home')
  const away = getCompetitor(competition, 'away')
  const homeAbbr = normalizeAbbreviation(home?.team?.abbreviation)
  const awayAbbr = normalizeAbbreviation(away?.team?.abbreviation)
  const gameDate = competition?.date || event.date

  if (!event.id || !homeAbbr || !awayAbbr || !home?.team?.displayName || !away?.team?.displayName) {
    throw new Error(`Incomplete ESPN matchup in week ${week}: ${event.id || '(missing id)'}`)
  }
  if (!gameDate || Number.isNaN(Date.parse(gameDate))) {
    throw new Error(`Invalid ESPN game date for ${event.id}`)
  }

  return {
    _id: `game-${event.id}`,
    eventId: String(event.id),
    homeAbbr,
    awayAbbr,
    fields: {
      week,
      homeTeam: home.team.displayName,
      awayTeam: away.team.displayName,
      gameDate: new Date(gameDate).toISOString(),
      dateTimeTBD:
        competition?.timeValid === false || event.status?.type?.shortDetail === 'TBD',
      tvNetwork: getNetwork(competition),
      venue: competition?.venue?.fullName,
      gameType: 'regular',
      published: true,
      season: String(season),
    },
  }
}

function validateSchedule(games) {
  if (games.length !== 272) {
    throw new Error(`Expected 272 regular-season games, received ${games.length}`)
  }

  const ids = new Set(games.map((game) => game._id))
  if (ids.size !== games.length) throw new Error('Duplicate ESPN event IDs found')

  const teamGames = new Map()
  for (const game of games) {
    for (const team of [game.homeAbbr, game.awayAbbr]) {
      teamGames.set(team, (teamGames.get(team) || 0) + 1)
    }
  }

  if (teamGames.size !== 32) {
    throw new Error(`Expected 32 teams, received ${teamGames.size}`)
  }
  const invalidTeams = [...teamGames].filter(([, count]) => count !== 17)
  if (invalidTeams.length) {
    throw new Error(`Teams without 17 games: ${JSON.stringify(invalidTeams)}`)
  }
}

async function main() {
  const weeks = await Promise.all(
    Array.from({length: 18}, (_, index) => fetchWeek(index + 1)),
  )
  const games = weeks.flat().map(mapEvent)
  validateSchedule(games)

  const existingIds = new Set(
    await client.fetch(`*[_id in $ids]._id`, {ids: games.map((game) => game._id)}),
  )
  const weekCounts = games.reduce((counts, game) => {
    counts[game.fields.week] = (counts[game.fields.week] || 0) + 1
    return counts
  }, {})
  const dateTimeTBD = games.filter((game) => game.fields.dateTimeTBD).length

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? 'apply' : 'dry-run',
        season,
        games: games.length,
        creates: games.length - existingIds.size,
        updates: existingIds.size,
        dateTimeTBD,
        weekCounts,
        week17: games
          .filter((game) => game.fields.week === 17)
          .map((game) => ({
            id: game.eventId,
            matchup: `${game.awayAbbr} @ ${game.homeAbbr}`,
            date: game.fields.gameDate,
            dateTimeTBD: game.fields.dateTimeTBD,
            network: game.fields.tvNetwork,
          })),
      },
      null,
      2,
    ),
  )

  if (!applyChanges) {
    console.log('\nDry run only. Re-run with --apply to sync the validated schedule.')
    return
  }

  const chunkSize = 25
  for (let index = 0; index < games.length; index += chunkSize) {
    const chunk = games.slice(index, index + chunkSize)
    const transaction = client.transaction()

    for (const game of chunk) {
      if (existingIds.has(game._id)) {
        transaction.patch(game._id, (patch) => patch.set(game.fields))
      } else {
        transaction.create({
          _id: game._id,
          _type: 'game',
          ...game.fields,
          featured: false,
          gameImportance: 'regular',
        })
      }
    }

    await transaction.commit()
    console.log(`Synced ${Math.min(index + chunk.length, games.length)}/${games.length}`)
  }

  const verification = await client.fetch(
    `{
      "total": count(*[_type == "game" && published == true && season == $season]),
      "week17": count(*[_type == "game" && published == true && season == $season && week == 17])
    }`,
    {season: String(season)},
  )
  if (verification.total !== 272 || verification.week17 !== 16) {
    throw new Error(`Post-sync verification failed: ${JSON.stringify(verification)}`)
  }

  console.log(`\nVerified ${verification.total} published games for ${season}.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

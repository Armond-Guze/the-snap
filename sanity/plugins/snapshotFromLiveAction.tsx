import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient, type SanityClient } from '@sanity/client'
import { useState } from 'react'
import { Button, Stack, Text, TextInput } from '@sanity/ui'
import { apiVersion, dataset, projectId } from '../env'
import {
  buildPowerRankingSeoPrefill,
  deriveBiggestMovers,
  normalizePowerRankingItems,
} from '../lib/powerRankingHelpers'

// Map of common team names/aliases to standard abbreviations
const NAME_TO_ABBR: Record<string, string> = {
  'arizona cardinals': 'ARI', 'cardinals': 'ARI', 'arizona': 'ARI',
  'atlanta falcons': 'ATL', 'falcons': 'ATL', 'atlanta': 'ATL',
  'baltimore ravens': 'BAL', 'ravens': 'BAL', 'baltimore': 'BAL',
  'buffalo bills': 'BUF', 'bills': 'BUF', 'buffalo': 'BUF',
  'carolina panthers': 'CAR', 'panthers': 'CAR', 'carolina': 'CAR',
  'chicago bears': 'CHI', 'bears': 'CHI', 'chicago': 'CHI',
  'cincinnati bengals': 'CIN', 'bengals': 'CIN', 'cincinnati': 'CIN',
  'cleveland browns': 'CLE', 'browns': 'CLE', 'cleveland': 'CLE',
  'dallas cowboys': 'DAL', 'cowboys': 'DAL', 'dallas': 'DAL',
  'denver broncos': 'DEN', 'broncos': 'DEN', 'denver': 'DEN',
  'detroit lions': 'DET', 'lions': 'DET', 'detroit': 'DET',
  'green bay packers': 'GB', 'packers': 'GB', 'green bay': 'GB',
  'houston texans': 'HOU', 'texans': 'HOU', 'houston': 'HOU',
  'indianapolis colts': 'IND', 'colts': 'IND', 'indianapolis': 'IND',
  'jacksonville jaguars': 'JAX', 'jaguars': 'JAX', 'jacksonville': 'JAX',
  'kansas city chiefs': 'KC', 'chiefs': 'KC', 'kansas city': 'KC',
  'las vegas raiders': 'LV', 'raiders': 'LV', 'vegas': 'LV', 'las vegas': 'LV',
  'los angeles chargers': 'LAC', 'chargers': 'LAC', 'la chargers': 'LAC',
  'los angeles rams': 'LAR', 'rams': 'LAR', 'la rams': 'LAR',
  'miami dolphins': 'MIA', 'dolphins': 'MIA', 'miami': 'MIA',
  'minnesota vikings': 'MIN', 'vikings': 'MIN', 'minnesota': 'MIN',
  'new england patriots': 'NE', 'patriots': 'NE', 'new england': 'NE',
  'new orleans saints': 'NO', 'saints': 'NO', 'new orleans': 'NO',
  'new york giants': 'NYG', 'giants': 'NYG',
  'new york jets': 'NYJ', 'jets': 'NYJ',
  'philadelphia eagles': 'PHI', 'eagles': 'PHI', 'philadelphia': 'PHI',
  'pittsburgh steelers': 'PIT', 'steelers': 'PIT', 'pittsburgh': 'PIT',
  'san francisco 49ers': 'SF', '49ers': 'SF', 'niners': 'SF', 'san francisco': 'SF',
  'seattle seahawks': 'SEA', 'seahawks': 'SEA', 'seattle': 'SEA',
  'tampa bay buccaneers': 'TB', 'buccaneers': 'TB', 'bucs': 'TB', 'tampa bay': 'TB',
  'tennessee titans': 'TEN', 'titans': 'TEN', 'tennessee': 'TEN',
  'washington commanders': 'WAS', 'commanders': 'WAS', 'washington': 'WAS',
}

function toAbbr(name?: string | null): string | null {
  if (!name) return null
  const key = String(name).trim().toLowerCase()
  return NAME_TO_ABBR[key] || null
}

const REGULAR_SEASON_MAX_WEEK = 17
const PLAYOFF_ROUNDS = [
  { value: 'WC', label: 'Wild Card' },
  { value: 'DIV', label: 'Divisional' },
  { value: 'CONF', label: 'Conference Championship' },
  { value: 'SB', label: 'Super Bowl' },
  { value: 'OFF', label: 'Offseason' },
] as const

type PlayoffRound = (typeof PLAYOFF_ROUNDS)[number]['value']
type SnapshotTarget =
  | { weekNumber: number; playoffRound?: undefined }
  | { playoffRound: PlayoffRound; weekNumber?: undefined }

type RankingRow = {
  rank?: number
  team?: Record<string, unknown>
  teamAbbr?: string
  teamName?: string
  teamColor?: string
  tier?: string
  note?: string
  summary?: string
  analysis?: unknown[]
  teamLogo?: unknown
}

type LivePowerRankingDoc = {
  _type?: string
  format?: string
  rankingType?: string
  seasonYear?: number
  rankings?: RankingRow[]
  title?: string
  homepageTitle?: string
  summary?: string
  coverImage?: unknown
  author?: unknown
  category?: unknown
  methodology?: string
  rankingIntro?: unknown[]
  rankingConclusion?: unknown[]
  teams?: unknown[]
  tagRefs?: unknown[]
  seo?: Record<string, unknown>
}

function getPrevPlayoffRound(round: PlayoffRound): PlayoffRound | null {
  const order: PlayoffRound[] = ['WC', 'DIV', 'CONF', 'SB', 'OFF']
  const index = order.indexOf(round)
  if (index <= 0) return null
  return order[index - 1]
}

function parseSnapshotTarget(value: string): SnapshotTarget | null {
  if (value.startsWith('week-')) {
    const week = Number(value.replace('week-', ''))
    if (Number.isFinite(week) && week >= 1 && week <= REGULAR_SEASON_MAX_WEEK) {
      return { weekNumber: week }
    }
    return null
  }
  const round = value.toUpperCase() as PlayoffRound
  if (PLAYOFF_ROUNDS.some((r) => r.value === round)) return { playoffRound: round }
  return null
}

function targetLabel(target: SnapshotTarget): string {
  if (target.weekNumber) return `Week ${target.weekNumber}`
  return PLAYOFF_ROUNDS.find((r) => r.value === target.playoffRound)?.label || target.playoffRound || 'Playoffs'
}

const SnapshotFromLivePowerRankingsAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props
  const doc = (draft || published) as LivePowerRankingDoc | undefined
  const isLivePowerRankings = !!doc && doc._type === 'article' && doc.format === 'powerRankings' && doc.rankingType === 'live'

  const now = new Date()
  const defaultSeason = String(doc?.seasonYear || now.getFullYear())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [seasonInput, setSeasonInput] = useState(defaultSeason)
  const [targetInput, setTargetInput] = useState('week-1')
  const [submitting, setSubmitting] = useState(false)

  if (!isLivePowerRankings) return null

  // Use a Studio-authenticated client via cookie credentials
  const client: SanityClient = createClient({ projectId, dataset, apiVersion, useCdn: false, withCredentials: true })

  const handleCreate = async (season: number, target: SnapshotTarget) => {
    try {
      const liveRankings = Array.isArray(doc.rankings) ? doc.rankings : []
      if (liveRankings.length !== 32) {
        throw new Error(`Expected 32 teams on the Live Power Rankings doc. Found ${liveRankings.length}.`)
      }

      let prev: { rankings?: { teamAbbr?: string; teamName?: string; rank: number }[] } | null = null
      if (target.weekNumber && target.weekNumber > 1) {
        prev = await client.fetch<{ rankings?: { teamAbbr?: string; teamName?: string; rank: number }[] } | null>(
          `*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && seasonYear==$season && weekNumber==$week][0]{ rankings[]{teamAbbr, teamName, rank} }`,
          { season, week: target.weekNumber - 1 }
        )
      } else if (target.playoffRound) {
        if (target.playoffRound === 'WC') {
          prev = await client.fetch<{ rankings?: { teamAbbr?: string; teamName?: string; rank: number }[] } | null>(
            `*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && seasonYear==$season && weekNumber==$week][0]{ rankings[]{teamAbbr, teamName, rank} }`,
            { season, week: REGULAR_SEASON_MAX_WEEK }
          )
        } else {
          const prevRound = getPrevPlayoffRound(target.playoffRound)
          if (prevRound) {
            prev = await client.fetch<{ rankings?: { teamAbbr?: string; teamName?: string; rank: number }[] } | null>(
              `*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && seasonYear==$season && playoffRound==$round][0]{ rankings[]{teamAbbr, teamName, rank} }`,
              { season, round: prevRound }
            )
          }
        }
      }

      const items = normalizePowerRankingItems(
        liveRankings.map((t: RankingRow) => {
          const teamTitle = typeof t.team?.title === 'string' ? t.team.title : undefined
          const name = t.teamName || teamTitle
          const abbr = t.teamAbbr || toAbbr(name || '') || (name || '').slice(0, 3).toUpperCase()
          const prevRank: number | undefined = prev?.rankings?.find(
            (p: { teamAbbr?: string; teamName?: string; rank: number }) => (p.teamAbbr || p.teamName) === (abbr || name)
          )?.rank
          const movement = typeof prevRank === 'number' && typeof t.rank === 'number' ? prevRank - t.rank : 0

          return {
            _type: 'powerRankingEntry',
            rank: t.rank,
            team: t.team || undefined,
            teamAbbr: abbr,
            teamName: name || abbr,
            teamColor: t.teamColor || undefined,
            teamLogo: t.teamLogo || undefined,
            tier: t.tier || undefined,
            summary: t.summary || t.note || '',
            note: t.note || t.summary || '',
            analysis: t.analysis || [],
            previousRank: typeof prevRank === 'number' ? prevRank : undefined,
            prevRankOverride: typeof prevRank === 'number' ? prevRank : undefined,
            movement,
            movementOverride: movement,
          }
        })
      )

      const movers = deriveBiggestMovers(items)
      const playoffRound = target.playoffRound
      const baseId = target.weekNumber
        ? `prw-${season}-w${target.weekNumber}`
        : `prw-${season}-${(playoffRound || 'playoffs').toLowerCase()}`
      const draftId = `drafts.${baseId}`
      const generatedTitle = target.weekNumber
        ? `NFL Power Rankings ${season} — Week ${target.weekNumber}`
        : `NFL Power Rankings ${season} — ${targetLabel(target)}`
      const generatedSlug = target.weekNumber
        ? `power-rankings-${season}-week-${target.weekNumber}`
        : `power-rankings-${season}-${(playoffRound || 'playoffs').toLowerCase()}`

      const seo = buildPowerRankingSeoPrefill({
        title: generatedTitle,
        seasonYear: season,
        weekNumber: target.weekNumber,
        playoffRound,
        summary: doc.summary,
      })

      await client.createOrReplace({
        _id: draftId,
        _type: 'article',
        format: 'powerRankings',
        rankingType: 'snapshot',
        seasonYear: season,
        weekNumber: target.weekNumber,
        playoffRound,
        title: generatedTitle,
        slug: { _type: 'slug', current: generatedSlug },
        homepageTitle: doc.homepageTitle || undefined,
        summary: doc.summary || undefined,
        coverImage: doc.coverImage || undefined,
        author: doc.author || undefined,
        category: doc.category || undefined,
        methodology: doc.methodology || undefined,
        rankingIntro: Array.isArray(doc.rankingIntro) ? doc.rankingIntro : undefined,
        rankingConclusion: Array.isArray(doc.rankingConclusion) ? doc.rankingConclusion : undefined,
        teams: Array.isArray(doc.teams) ? doc.teams : undefined,
        tagRefs: Array.isArray(doc.tagRefs) ? doc.tagRefs : undefined,
        seo: { ...(doc.seo || {}), ...seo },
        date: new Date().toISOString(),
        published: false,
        editorialStatus: 'draft',
        biggestRiser: movers.biggestRiser,
        biggestFaller: movers.biggestFaller,
        rankings: items,
      })

      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({
        status: 'success',
        title: `Draft snapshot created: ${targetLabel(target)} — ${season}`,
        description: 'Saved as draft with helpers and SEO prefill.',
      })
      props.onComplete?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({ status: 'error', title: 'Snapshot failed', description: msg })
    }
  }

  const runSnapshot = async () => {
    const season = Number(seasonInput)
    const target = parseSnapshotTarget(targetInput)
    if (!Number.isFinite(season) || !target) {
      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({
        status: 'warning',
        title: 'Invalid input',
        description: `Choose a valid week (1–${REGULAR_SEASON_MAX_WEEK}), playoff round, or offseason.`,
      })
      return
    }
    setSubmitting(true)
    try {
      await handleCreate(season, target)
    } finally {
      setSubmitting(false)
      setDialogOpen(false)
    }
  }

  return {
    label: 'Snapshot from Live (All Teams)',
    onHandle: () => setDialogOpen(true),
    disabled: submitting,
    dialog: dialogOpen
      ? {
          type: 'dialog',
          onClose: () => (!submitting ? setDialogOpen(false) : undefined),
          header: 'Create snapshot',
          content: (
            <Stack space={4} padding={4}>
              <Text size={1} muted>
                Choose the season and target to snapshot. Regular season supports Weeks 1–17, then Wild Card, Divisional, Conference Championship, Super Bowl, and Offseason.
              </Text>
              <TextInput
                type="number"
                value={seasonInput}
                onChange={(e) => setSeasonInput(e.currentTarget.value)}
                placeholder="Season (e.g., 2025)"
              />
              <label style={{ display: 'grid', gap: 8 }}>
                <Text size={1} muted>Snapshot target</Text>
                <select
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.currentTarget.value)}
                  style={{
                    width: '100%',
                    background: 'var(--card-bg-color)',
                    color: 'inherit',
                    border: '1px solid var(--card-border-color)',
                    borderRadius: 6,
                    padding: '9px 10px',
                  }}
                >
                  <optgroup label="Regular Season">
                    {Array.from({ length: REGULAR_SEASON_MAX_WEEK }, (_, i) => i + 1).map((week) => (
                      <option key={week} value={`week-${week}`}>
                        Week {week}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Playoffs & Offseason">
                    {PLAYOFF_ROUNDS.map((round) => (
                      <option key={round.value} value={round.value}>
                        {round.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <Stack space={3}>
                <Button
                  tone="primary"
                  text={submitting ? 'Creating…' : 'Create snapshot'}
                  disabled={submitting}
                  onClick={runSnapshot}
                />
                <Button text="Cancel" mode="ghost" disabled={submitting} onClick={() => setDialogOpen(false)} />
              </Stack>
            </Stack>
          ),
        }
      : undefined,
  }
}

export const snapshotFromLivePowerRankingsAction = SnapshotFromLivePowerRankingsAction

export default SnapshotFromLivePowerRankingsAction

import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient, type SanityClient } from '@sanity/client'
import { useState } from 'react'
import { Button, Stack, Text, TextInput } from '@sanity/ui'
import { apiVersion, dataset, projectId } from '../env'

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

export const snapshotFromLivePowerRankingsAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props
  const doc = (draft || published) as { _type?: string; format?: string; rankingType?: string; seasonYear?: number; rankings?: Array<any>; title?: string } | undefined
  const isLivePowerRankings = !!doc && doc._type === 'article' && doc.format === 'powerRankings' && doc.rankingType === 'live'

  const now = new Date()
  const defaultSeason = String(doc?.seasonYear || now.getFullYear())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [seasonInput, setSeasonInput] = useState(defaultSeason)
  const [weekInput, setWeekInput] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  if (!isLivePowerRankings) return null

  // Use a Studio-authenticated client via cookie credentials
  const client: SanityClient = createClient({ projectId, dataset, apiVersion, useCdn: false, withCredentials: true })

  const handleCreate = async (season: number, week: number) => {
      try {
        const liveRankings = Array.isArray(doc.rankings) ? doc.rankings : []
        if (liveRankings.length !== 32) {
          throw new Error(`Expected 32 teams on the Live Power Rankings doc. Found ${liveRankings.length}.`) 
        }

        // Fetch previous week's snapshot (to compute movement)
        const prevWeek = week - 1
        const prev = prevWeek >= 1
          ? await client.fetch<{ rankings?: { teamAbbr?: string; teamName?: string; rank: number }[] } | null>(
              `*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && seasonYear==$season && weekNumber==$week][0]{ rankings[]{teamAbbr, teamName, rank} }`,
              { season, week: prevWeek }
            )
          : null

        const items = liveRankings.map((t: any) => {
          const name = t.teamName || t?.team?.title
          const abbr = t.teamAbbr || toAbbr(name || '') || (name || '').slice(0, 3).toUpperCase()
          const prevRank: number | undefined = prev?.rankings?.find((p: { teamAbbr?: string; teamName?: string; rank: number }) => (p.teamAbbr || p.teamName) === (abbr || name))?.rank
          return {
            _type: 'object',
            rank: t.rank,
            team: t.team || undefined,
            teamAbbr: abbr,
            teamName: name || abbr,
            note: t.note || '',
            analysis: t.analysis || [],
            teamLogo: t.teamLogo || undefined,
            prevRankOverride: typeof prevRank === 'number' ? prevRank : undefined,
          }
        })

        const id = `prw-${season}-w${week}`
        await client.createOrReplace({
          _id: id,
          _type: 'article',
          format: 'powerRankings',
          rankingType: 'snapshot',
          seasonYear: season,
          weekNumber: week,
          title: doc.title || `NFL Power Rankings ${season} — Week ${week}`,
          slug: { _type: 'slug', current: `power-rankings-${season}-week-${week}` },
          date: new Date().toISOString(),
          published: true,
          rankings: items,
        })
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'success', title: `Snapshot created: Week ${week} — ${season}` })
        // If we had to fall back to drafts, let the user know
        // We can detect this by checking for any draft IDs in the teams query above, but since we merged data,
        // just provide a general info message to publish for future runs.
        try {
          const publishedCount: number = await client.fetch<number>(
            `count(*[_type=="article" && format=="powerRankings" && rankingType=="live" && published==true])`
          )
          if (publishedCount < 1) {
            // @ts-expect-error toast may be undefined depending on Studio version
            props?.toast?.push?.({ status: 'info', title: 'Live doc not published', description: 'Publish the live Power Rankings article for consistent snapshots.' })
          }
        } catch {}
        props.onComplete?.()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'error', title: 'Snapshot failed', description: msg })
      } finally {
      }
    }

  const runSnapshot = async () => {
    const season = Number(seasonInput)
    const week = Number(weekInput)
    if (!Number.isFinite(season) || !Number.isFinite(week) || week < 1 || week > 25) {
      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({ status: 'warning', title: 'Invalid input', description: 'Provide a valid season and week (1–25).' })
      return
    }
    setSubmitting(true)
    try {
      await handleCreate(season, week)
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
          header: 'Create week snapshot',
          content: (
            <Stack space={4} padding={4}>
              <Text size={1} muted>
                Choose the season and week to snapshot. This will replace any existing snapshot for that week.
              </Text>
              <TextInput
                type="number"
                value={seasonInput}
                onChange={(e) => setSeasonInput(e.currentTarget.value)}
                placeholder="Season (e.g., 2025)"
              />
              <TextInput
                type="number"
                value={weekInput}
                onChange={(e) => setWeekInput(e.currentTarget.value)}
                placeholder="Week number (1–25)"
              />
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

export default snapshotFromLivePowerRankingsAction

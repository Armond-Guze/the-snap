import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient } from 'next-sanity'
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
  const doc = (draft || published) as { _type?: string } | undefined
  if (!doc || doc._type !== 'powerRanking') return null

  const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

  const handleCreate = async (season: number, week: number) => {
      try {
        // Fetch all live power rankings
        const teams: Array<{ rank: number; teamName?: string; summary?: string }> = await client.fetch(
          `*[_type=="powerRanking"]|order(rank asc){ rank, teamName, summary }`
        )
        if (!teams || teams.length !== 32) {
          throw new Error(`Expected 32 teams, found ${teams?.length ?? 0}. Ensure ranks 1–32 exist.`)
        }

        // Fetch previous week's snapshot (to compute movement)
        const prevWeek = week - 1
        const prev = prevWeek >= 1
          ? await client.fetch(
              `*[_type=="powerRankingWeek" && season==$season && week==$week][0]{ items[]{teamAbbr, rank} }`,
              { season, week: prevWeek }
            )
          : null

        const items = teams.map((t) => {
          const abbr = toAbbr(t.teamName || '') || (t.teamName || '').slice(0, 3).toUpperCase()
          const prevRank: number | undefined = prev?.items?.find((p: { teamAbbr: string; rank: number }) => p.teamAbbr === abbr)?.rank
          const movement = typeof prevRank === 'number' ? prevRank - t.rank : 0
          return {
            _type: 'object',
            rank: t.rank,
            teamAbbr: abbr,
            teamName: t.teamName || abbr,
            note: t.summary || '',
            prevRank: typeof prevRank === 'number' ? prevRank : null,
            movement,
          }
        })

        const id = `prw-${season}-w${week}`
        await client.createOrReplace({
          _id: id,
          _type: 'powerRankingWeek',
          season,
          week,
          items,
          publishedAt: new Date().toISOString(),
          slug: { _type: 'slug', current: `week-${week}-${season}` },
        })
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'success', title: `Snapshot created: Week ${week} — ${season}` })
        props.onComplete?.()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'error', title: 'Snapshot failed', description: msg })
      } finally {
      }
    }

  return {
    label: 'Snapshot from Live (All Teams)',
    onHandle: async () => {
      // Simple prompt-based flow to avoid React state in actions
      const now = new Date()
      const defaultSeason = String(now.getFullYear())
      const seasonStr = typeof window !== 'undefined' ? window.prompt('Season (e.g., 2025):', defaultSeason) : defaultSeason
      if (!seasonStr) return
      const weekStr = typeof window !== 'undefined' ? window.prompt('Week number (1–25):', '1') : '1'
      if (!weekStr) return
      const season = Number(seasonStr)
      const week = Number(weekStr)
      if (!Number.isFinite(season) || !Number.isFinite(week) || week < 1 || week > 25) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'warning', title: 'Invalid input', description: 'Please provide a valid season and week (1–25).' })
        return
      }
      await handleCreate(season, week)
    },
  }
}

export default snapshotFromLivePowerRankingsAction

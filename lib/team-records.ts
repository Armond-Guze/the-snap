import { client } from '@/sanity/lib/client'

export interface TeamRecordDoc {
  _id: string
  teamAbbr: string
  season: number
  wins: number
  losses: number
  ties?: number
  streak?: string
}

const RECORDS_QUERY = `
  *[_type == "teamRecord" && season == $season]{
    _id, teamAbbr, season, wins, losses, ties, streak
  }
`

export async function fetchTeamRecords(season: number) {
  try {
    const docs = await client.fetch<TeamRecordDoc[]>(RECORDS_QUERY, { season })
    const map = new Map<string, TeamRecordDoc>()
    for (const d of docs) {
      map.set(d.teamAbbr.toUpperCase(), d)
    }
    return map
  } catch (e) {
    console.warn('fetchTeamRecords failed', e)
    return new Map<string, TeamRecordDoc>()
  }
}

export function shortRecord(rec?: TeamRecordDoc | null) {
  if (!rec) return ''
  const t = rec.ties && rec.ties > 0 ? `-${rec.ties}` : ''
  return `${rec.wins}-${rec.losses}${t}`
}

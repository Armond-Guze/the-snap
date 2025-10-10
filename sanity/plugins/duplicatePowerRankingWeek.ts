import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '../env'

type WeekItem = { rank: number; teamAbbr: string; teamName?: string; note?: string; prevRank?: number | null; movement?: number | null }

const buildId = (season: number, week: number) => `prw-${season}-w${week}`
const buildSlug = (season: number, week: number) => `week-${week}-${season}`

export const duplicatePowerRankingWeekAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props
  const doc = (draft || published) as { _type?: string } | undefined
  if (!doc || doc._type !== 'powerRankingWeek') return null

  const client: SanityClient = createClient({ projectId, dataset, apiVersion, useCdn: false, withCredentials: true })

  const run = async () => {
    try {
      const latest = await client.fetch<{ season: number; week: number; items: WeekItem[] } | null>(
        `*[_type=="powerRankingWeek"]|order(season desc, week desc)[0]{ season, week, items[]{rank, teamAbbr, teamName, note, prevRank, movement} }`
      )
      if (!latest) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'warning', title: 'No previous snapshot found', description: 'Create the first snapshot using "Snapshot from Live" instead.' })
        return
      }
      const defaultSeason = String(latest.season)
      const defaultWeek = String(latest.week + 1)
      const seasonStr = typeof window !== 'undefined' ? window.prompt('Season (e.g., 2025):', defaultSeason) : defaultSeason
      if (!seasonStr) return
      const weekStr = typeof window !== 'undefined' ? window.prompt('New week number:', defaultWeek) : defaultWeek
      if (!weekStr) return
      const season = Number(seasonStr)
      const week = Number(weekStr)
      if (!Number.isFinite(season) || !Number.isFinite(week) || week < 1 || week > 25) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'warning', title: 'Invalid input', description: 'Please provide a valid season and week (1–25).' })
        return
      }

      const items: WeekItem[] = (latest.items || []).map((it) => ({
        rank: it.rank,
        teamAbbr: it.teamAbbr,
        teamName: it.teamName,
        note: '', // start fresh notes for the new week
        prevRank: it.rank,
        movement: 0,
      }))

      const _id = buildId(season, week)
      await client.create({
        _id,
        _type: 'powerRankingWeek',
        season,
        week,
        items,
        publishedAt: new Date().toISOString(),
        slug: { _type: 'slug', current: buildSlug(season, week) },
      })

      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({ status: 'success', title: `Duplicated Week ${latest.week} → Week ${week}`, description: `New snapshot created for ${season}` })
      props.onComplete?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({ status: 'error', title: 'Duplicate failed', description: msg })
    }
  }

  return {
    label: 'Duplicate Last Week (+1)',
    onHandle: run,
  }
}

export default duplicatePowerRankingWeekAction

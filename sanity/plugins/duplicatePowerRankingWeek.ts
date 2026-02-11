import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '../env'

type WeekItem = { rank: number; team?: any; teamAbbr?: string; teamName?: string; note?: string; analysis?: any[]; teamLogo?: any }

const buildId = (season: number, week: number) => `prw-${season}-w${week}`
const buildSlug = (season: number, week: number) => `power-rankings-${season}-week-${week}`

export const duplicatePowerRankingWeekAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props
  const doc = (draft || published) as { _type?: string; format?: string; rankingType?: string } | undefined
  if (!doc || doc._type !== 'article' || doc.format !== 'powerRankings' || doc.rankingType !== 'snapshot') return null

  const client: SanityClient = createClient({ projectId, dataset, apiVersion, useCdn: false, withCredentials: true })

  const run = async () => {
    try {
      const latest = await client.fetch<{
        seasonYear: number
        weekNumber: number
        rankings: (WeekItem & { team?: any })[]
        homepageTitle?: string
        summary?: string
        coverImage?: any
        author?: any
        category?: any
        methodology?: string
        teams?: any[]
        tagRefs?: any[]
        seo?: any
      } | null>(
        `*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && weekNumber >= 1]|order(seasonYear desc, weekNumber desc)[0]{ seasonYear, weekNumber, homepageTitle, summary, coverImage, author, category, methodology, teams, tagRefs, seo, rankings[]{rank, team, teamAbbr, teamName, note, analysis, teamLogo} }`
      )
      if (!latest) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({ status: 'warning', title: 'No previous snapshot found', description: 'Create the first snapshot using "Snapshot from Live" instead.' })
        return
      }
      const defaultSeason = String(latest.seasonYear)
      const defaultWeek = String(latest.weekNumber + 1)
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

      const items: WeekItem[] = (latest.rankings || []).map((it: any) => ({
        rank: it.rank,
        team: it.team,
        teamAbbr: it.teamAbbr,
        teamName: it.teamName,
        note: '',
        analysis: [],
        teamLogo: it.teamLogo,
      }))

      const _id = buildId(season, week)
      await client.create({
        _id,
        _type: 'article',
        format: 'powerRankings',
        rankingType: 'snapshot',
        seasonYear: season,
        weekNumber: week,
        title: `NFL Power Rankings ${season} — Week ${week}`,
        slug: { _type: 'slug', current: buildSlug(season, week) },
        homepageTitle: latest.homepageTitle || undefined,
        summary: latest.summary || undefined,
        coverImage: latest.coverImage || undefined,
        author: latest.author || undefined,
        category: latest.category || undefined,
        methodology: latest.methodology || undefined,
        teams: Array.isArray(latest.teams) ? latest.teams : undefined,
        tagRefs: Array.isArray(latest.tagRefs) ? latest.tagRefs : undefined,
        seo: latest.seo || undefined,
        date: new Date().toISOString(),
        published: true,
        rankings: items,
      })

      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({ status: 'success', title: `Duplicated Week ${latest.weekNumber} → Week ${week}`, description: `New snapshot created for ${season}` })
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

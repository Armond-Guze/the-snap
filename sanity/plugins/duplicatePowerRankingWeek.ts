import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '../env'
import {
  buildPowerRankingSeoPrefill,
  deriveBiggestMovers,
  normalizePowerRankingItems,
  type PowerRankingEntryLike,
} from '../lib/powerRankingHelpers'

type SnapshotDoc = {
  seasonYear: number
  weekNumber: number
  rankings: PowerRankingEntryLike[]
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

const buildId = (season: number, week: number) => `prw-${season}-w${week}`
const buildSlug = (season: number, week: number) => `power-rankings-${season}-week-${week}`

export const duplicatePowerRankingWeekAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props
  const doc = (draft || published) as { _type?: string; format?: string } | undefined
  if (!doc || doc._type !== 'article' || doc.format !== 'powerRankings') return null

  const client: SanityClient = createClient({ projectId, dataset, apiVersion, useCdn: false, withCredentials: true })

  const run = async () => {
    try {
      const latest = await client.fetch<SnapshotDoc | null>(
        `*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && weekNumber >= 1]
          | order(seasonYear desc, weekNumber desc)[0]{
            seasonYear,
            weekNumber,
            homepageTitle,
            summary,
            coverImage,
            author,
            category,
            methodology,
            rankingIntro,
            rankingConclusion,
            teams,
            tagRefs,
            seo,
            rankings[]{
              rank,
              team,
              teamAbbr,
              teamName,
              teamColor,
              teamLogo,
              summary,
              note,
              analysis,
              previousRank,
              movement,
              prevRankOverride,
              movementOverride,
              tier
            }
          }`
      )

      if (!latest) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({
          status: 'warning',
          title: 'No previous snapshot found',
          description: 'Create your first snapshot from the live rankings doc.',
        })
        return
      }

      const defaultSeason = String(latest.seasonYear)
      const defaultWeek = String(latest.weekNumber + 1)
      const seasonStr = typeof window !== 'undefined' ? window.prompt('Season (e.g., 2026):', defaultSeason) : defaultSeason
      if (!seasonStr) return
      const weekStr = typeof window !== 'undefined' ? window.prompt('New week number:', defaultWeek) : defaultWeek
      if (!weekStr) return

      const season = Number(seasonStr)
      const week = Number(weekStr)
      if (!Number.isFinite(season) || !Number.isFinite(week) || week < 1 || week > 25) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({
          status: 'warning',
          title: 'Invalid input',
          description: 'Please provide a valid season and week (1-25).',
        })
        return
      }

      const baseId = buildId(season, week)
      const draftId = `drafts.${baseId}`
      const existing = await client.fetch<number>(`count(*[_id in [$draftId, $publishedId]])`, {
        draftId,
        publishedId: baseId,
      })
      if (existing > 0) {
        // @ts-expect-error toast may be undefined depending on Studio version
        props?.toast?.push?.({
          status: 'warning',
          title: 'Week already exists',
          description: `A draft or published snapshot for Week ${week}, ${season} already exists.`,
        })
        return
      }

      const seededItems = normalizePowerRankingItems(
        (latest.rankings || []).map((item) => ({
          _type: 'powerRankingEntry',
          ...item,
          previousRank: typeof item.rank === 'number' ? item.rank : item.previousRank,
          prevRankOverride: typeof item.rank === 'number' ? item.rank : item.prevRankOverride,
          movement: 0,
          movementOverride: 0,
          analysis: [],
        }))
      )

      const movers = deriveBiggestMovers(seededItems)
      const seoPrefill = buildPowerRankingSeoPrefill({
        title: `NFL Power Rankings ${season} — Week ${week}`,
        seasonYear: season,
        weekNumber: week,
        summary: latest.summary,
      })

      await client.create({
        _id: draftId,
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
        rankingIntro: Array.isArray(latest.rankingIntro) ? latest.rankingIntro : undefined,
        rankingConclusion: Array.isArray(latest.rankingConclusion) ? latest.rankingConclusion : undefined,
        teams: Array.isArray(latest.teams) ? latest.teams : undefined,
        tagRefs: Array.isArray(latest.tagRefs) ? latest.tagRefs : undefined,
        seo: { ...(latest.seo || {}), ...seoPrefill },
        date: new Date().toISOString(),
        published: false,
        editorialStatus: 'draft',
        biggestRiser: movers.biggestRiser,
        biggestFaller: movers.biggestFaller,
        rankings: seededItems,
      })

      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({
        status: 'success',
        title: `Draft created for Week ${week}`,
        description: `Duplicated from Week ${latest.weekNumber}. Review and publish when ready.`,
      })
      props.onComplete?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({ status: 'error', title: 'Duplicate failed', description: msg })
    }
  }

  return {
    label: 'Duplicate Last Week',
    onHandle: run,
  }
}

export default duplicatePowerRankingWeekAction

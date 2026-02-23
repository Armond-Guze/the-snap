import type { DocumentActionComponent } from 'sanity'
import {
  buildPowerRankingSeoPrefill,
  deriveBiggestMovers,
  normalizePowerRankingItems,
} from '../lib/powerRankingHelpers'

export const powerRankingHelpersAction: DocumentActionComponent = (props) => {
  const doc = (props.draft || props.published) as
    | {
        _type?: string
        format?: string
        rankingType?: string
        title?: string
        summary?: string
        seasonYear?: number
        weekNumber?: number
        playoffRound?: string
        rankings?: unknown[]
        seo?: Record<string, unknown>
      }
    | undefined

  if (!doc || doc._type !== 'article' || doc.format !== 'powerRankings') return null

  return {
    label: 'Refresh Ranking Helpers',
    onHandle: () => {
      const normalized = normalizePowerRankingItems(Array.isArray(doc.rankings) ? doc.rankings : [])
      const movers = deriveBiggestMovers(normalized)
      const shouldAutoSeo = !doc.seo || doc.seo.autoGenerate !== false
      const nowIso = new Date().toISOString()

      const patch: Record<string, unknown> = {
        rankings: normalized,
        biggestRiser: movers.biggestRiser,
        biggestFaller: movers.biggestFaller,
      }

      if (shouldAutoSeo) {
        patch.seo = {
          ...(doc.seo || {}),
          ...buildPowerRankingSeoPrefill({
            title: doc.title,
            summary: doc.summary,
            seasonYear: doc.seasonYear,
            weekNumber: doc.weekNumber,
            playoffRound: doc.playoffRound,
          }),
          lastGenerated: nowIso,
        }
      }

      const patchDoc = (props as { patch?: (operation: { set: Record<string, unknown> }) => void }).patch
      patchDoc?.({ set: patch })

      // @ts-expect-error toast may be undefined depending on Studio version
      props?.toast?.push?.({
        status: 'success',
        title: 'Ranking helpers updated',
        description: shouldAutoSeo ? 'Biggest riser/faller and SEO prefill refreshed.' : 'Biggest riser/faller refreshed.',
      })
      props.onComplete()
    },
  }
}

export default powerRankingHelpersAction

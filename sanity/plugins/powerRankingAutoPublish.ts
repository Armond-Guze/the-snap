import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import {
  buildPowerRankingSeoPrefill,
  deriveBiggestMovers,
  normalizePowerRankingItems,
} from '../lib/powerRankingHelpers'

type ArticleDoc = {
  _type?: string
  format?: string
  title?: string
  summary?: string
  seasonYear?: number
  weekNumber?: number
  playoffRound?: string
  seo?: Record<string, unknown>
  rankings?: unknown[]
}

type ActionComponentWithAction = DocumentActionComponent & { action?: string }

function isPowerRankingArticle(doc?: ArticleDoc): doc is ArticleDoc & { _type: 'article'; format: 'powerRankings' } {
  return !!doc && doc._type === 'article' && doc.format === 'powerRankings'
}

export function withPowerRankingAutoPublishHelpers(action: DocumentActionComponent): DocumentActionComponent {
  const actionWithMeta = action as ActionComponentWithAction
  if (actionWithMeta.action !== 'publish') return action

  const wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    const originalResult = action(props)
    const doc = (props.draft || props.published) as ArticleDoc | undefined

    if (!isPowerRankingArticle(doc) || !originalResult) return originalResult
    const powerDoc = doc

    return {
      ...originalResult,
      onHandle: () => {
        const normalized = normalizePowerRankingItems(Array.isArray(powerDoc.rankings) ? powerDoc.rankings : [])
        const movers = deriveBiggestMovers(normalized)
        const patchPayload: Record<string, unknown> = {
          rankings: normalized,
          biggestRiser: movers.biggestRiser,
          biggestFaller: movers.biggestFaller,
          editorialStatus: 'published',
        }

        const shouldAutoSeo = !powerDoc.seo || powerDoc.seo.autoGenerate !== false
        if (shouldAutoSeo) {
          patchPayload.seo = {
            ...(powerDoc.seo || {}),
            ...buildPowerRankingSeoPrefill({
              title: powerDoc.title,
              summary: powerDoc.summary,
              seasonYear: powerDoc.seasonYear,
              weekNumber: powerDoc.weekNumber,
              playoffRound: powerDoc.playoffRound,
            }),
            lastGenerated: new Date().toISOString(),
          }
        }

        const patchDoc = (props as { patch?: (operation: { set: Record<string, unknown> }) => void }).patch
        patchDoc?.({ set: patchPayload })
        originalResult.onHandle?.()
      },
    }
  }

  ;(wrapped as ActionComponentWithAction).action = actionWithMeta.action
  return wrapped
}

export default withPowerRankingAutoPublishHelpers

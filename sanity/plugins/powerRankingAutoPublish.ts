import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {apiVersion} from '../env'
import {
  buildPowerRankingSeoPrefill,
  deriveBiggestMovers,
  normalizePowerRankingItems,
} from '../lib/powerRankingHelpers'

type ArticleDoc = {
  _id?: string
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

  const WrappedAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const originalResult = action(props)
    const client = useClient({apiVersion})
    const [preparing, setPreparing] = useState(false)
    const [prepareError, setPrepareError] = useState<string>()
    const doc = props.draft as ArticleDoc | undefined

    if (!isPowerRankingArticle(doc) || !originalResult) return originalResult
    const powerDoc = doc

    return {
      ...originalResult,
      disabled: preparing || originalResult.disabled,
      label: preparing ? 'Preparing rankings…' : originalResult.label,
      title: prepareError || originalResult.title,
      onHandle: () => {
        if (preparing) return

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

        const publishedId = props.id.replace(/^drafts\./, '')
        const draftId = powerDoc._id || `drafts.${publishedId}`

        setPreparing(true)
        setPrepareError(undefined)
        void client
          .patch(draftId)
          .set(patchPayload)
          .commit({autoGenerateArrayKeys: true})
          .then(() => {
            originalResult.onHandle?.()
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Unable to prepare the rankings draft'
            setPrepareError(`Publish preparation failed: ${message}`)
          })
          .finally(() => {
            setPreparing(false)
          })
      },
    }
  }

  ;(WrappedAction as ActionComponentWithAction).action = actionWithMeta.action
  return WrappedAction
}

export default withPowerRankingAutoPublishHelpers

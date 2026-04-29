import type { DocumentActionComponent } from 'sanity'
import {
  generateHeadlineSeo,
  generateRankingsSeo,
  type AutoSeoResult,
} from '../../lib/auto-seo-generator'

type SeoState = Partial<AutoSeoResult> & {
  autoGenerate?: boolean
  lastGenerated?: string
}

type SeoActionDoc = {
  _type: 'headline' | 'rankings' | 'category'
  title?: string
  summary?: string
  description?: string
  body?: Array<{children?: Array<{text?: string}>}>
  category?: {title?: string}
  tags?: string[]
  seo?: SeoState
}

type PatchableActionProps = {
  patch?: (mutation: {set: {seo: SeoState}}) => void
}

// Custom document action to regenerate SEO fields when autoGenerate is enabled.
export const seoRegenerateAction: DocumentActionComponent = (props) => {
  const doc = (props.draft || props.published) as SeoActionDoc | null
  if (!doc) return null
  const seo = doc.seo
  if (!seo || seo.autoGenerate === false) return null
  if (!['headline', 'rankings', 'category'].includes(doc._type)) return null

  return {
    label: 'Regenerate SEO',
    onHandle: () => {
      let updated: AutoSeoResult | undefined
      if (doc._type === 'headline') {
        updated = generateHeadlineSeo(doc)
      } else if (doc._type === 'rankings') {
        updated = generateRankingsSeo(doc)
      } else if (doc._type === 'category') {
        updated = generateHeadlineSeo({
          title: doc.title,
          summary: doc.description,
          category: { title: doc.title },
          tags: [],
          body: [],
          seo: doc.seo
        })
      }
      if (updated) {
        const patchableProps = props as typeof props & PatchableActionProps
        patchableProps.patch?.({
          set: {
            seo: {
              ...(doc.seo || {}),
              ...updated,
              autoGenerate: true,
              lastGenerated: new Date().toISOString(),
            }
          }
        })
      }
      props.onComplete()
    }
  }
}

export default seoRegenerateAction

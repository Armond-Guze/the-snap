import {DocumentActionComponent, SanityDocument, useDocumentOperation} from 'sanity'
import {
  AutoSeoResult,
  generateHeadlineSeo,
  generateRankingsSeo,
} from '../../lib/auto-seo-generator'

type SeoDocument = SanityDocument & {
  title?: string
  summary?: string
  description?: string
  rankingType?: string
  category?: {title?: string}
  tags?: string[]
  body?: Array<{children?: Array<{text?: string}>}>
  editorialBrief?: {targetQuery?: string}
  seo?: Partial<AutoSeoResult> & {autoGenerate?: boolean}
}

// Custom document action to regenerate SEO fields when autoGenerate is enabled.
export const SeoRegenerateAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const doc = (props.draft || props.published) as SeoDocument | null
  if (!doc) return null
  const seo = doc.seo
  if (seo?.autoGenerate === false) return null
  if (!['article', 'headline', 'rankings', 'category'].includes(doc._type)) return null

  return {
    label: 'Regenerate SEO',
    onHandle: () => {
      let updated: AutoSeoResult | undefined
      if (doc._type === 'article' || doc._type === 'headline') {
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
        patch.execute([{
          set: {
            seo: {
              ...(doc.seo || {}),
              ...updated,
              autoGenerate: true,
              lastGenerated: new Date().toISOString(),
            }
          }
        }])
      }
      props.onComplete()
    }
  }
}

export default SeoRegenerateAction

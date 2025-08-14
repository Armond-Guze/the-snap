import { DocumentActionComponent } from 'sanity'
import { generateHeadlineSeo, generateRankingsSeo } from '../../lib/auto-seo-generator'

// Custom document action to regenerate SEO fields when autoGenerate is enabled.
export const seoRegenerateAction: DocumentActionComponent = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = props.draft || props.published
  if (!doc) return null
  const seo = doc.seo
  if (!seo || seo.autoGenerate === false) return null
  if (!['headline', 'rankings', 'category'].includes(doc._type)) return null

  return {
    label: 'Regenerate SEO',
    onHandle: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updated: any
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
        } as any)
      }
      if (updated) {
        // Expose patch via returned object pattern
        ;(props as any).patch?.({
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

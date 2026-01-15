import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '../env'

const MATCHERS: Array<{ key: RegExp; title: string }> = [
  { key: /\bthursday night (football)?\b|\btnf\b/i, title: 'Thursday Night Football' },
  { key: /\bmonday night (football)?\b|\bmnf\b/i, title: 'Monday Night Football' },
  { key: /\bsunday night (football)?\b|\bsnf\b/i, title: 'Sunday Night Football' },
]

type HeadlineDoc = { _id?: string; _type?: string; title?: string; tagRefs?: Array<{ _type: 'reference'; _ref: string }>; }

export const suggestPrimetimeTagAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props
  const doc = (draft || published) as HeadlineDoc
  if (!doc || doc._type !== 'headline') return null

  const client: SanityClient = createClient({ projectId, dataset, apiVersion, useCdn: false, withCredentials: true })

  const run = async () => {
    try {
      const title: string = String(doc.title || '')
      const match = MATCHERS.find(m => m.key.test(title))
      if (!match) {
        // @ts-expect-error toast optional
        props?.toast?.push?.({ status: 'info', title: 'No primetime match', description: 'Headline does not mention MNF/TNF/SNF.' })
        return
      }
      // Find or create the tag
      let tag = await client.fetch(`*[_type=="advancedTag" && title==$t][0]{_id,title}`, { t: match.title })
      if (!tag) {
        tag = await client.create({ _type: 'advancedTag', title: match.title, slug: { _type: 'slug', current: match.title.toLowerCase().replace(/\s+/g,'-') } })
      }
  const existingRefs: string[] = (doc.tagRefs || []).map((r) => r?._ref).filter(Boolean as unknown as (v: unknown) => v is string)
      if (existingRefs.includes(tag._id)) {
        // @ts-expect-error toast optional
        props?.toast?.push?.({ status: 'info', title: 'Primetime tag already present', description: match.title })
        return
      }
      const nextRefs = [...(doc.tagRefs || []), { _type: 'reference', _ref: tag._id }]
  const pubId = (published && typeof (published as { _id?: unknown })._id === 'string') ? (published as { _id: string })._id : undefined
  const targetId = doc._id || pubId
      if (!targetId || typeof targetId !== 'string') {
        // @ts-expect-error toast optional
        props?.toast?.push?.({ status: 'warning', title: 'Cannot update tags', description: 'Missing document ID' })
        return
      }
      await client.patch(targetId).set({ tagRefs: nextRefs }).commit({ autoGenerateArrayKeys: true })
      // @ts-expect-error toast optional
      props?.toast?.push?.({ status: 'success', title: 'Added primetime tag', description: match.title })
      props.onComplete?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // @ts-expect-error toast optional
      props?.toast?.push?.({ status: 'error', title: 'Suggest tag failed', description: msg })
    }
  }

  return {
    label: 'Suggest Primetime Tag',
    onHandle: run,
  }
}

export default suggestPrimetimeTagAction

// Utility to auto-generate SEO metadata for Sanity documents.
// This runs on the client (Studio) side when invoked via custom actions or could be used server side.

export interface AutoSeoInput {
  title?: string
  summary?: string
  bodyText?: string
  categoryTitle?: string
  tags?: string[]
  rankingType?: string
  existing?: Partial<AutoSeoResult>
}

export interface AutoSeoResult {
  metaTitle: string
  metaDescription: string
  focusKeyword?: string
  additionalKeywords?: string[]
  ogTitle: string
  ogDescription: string
}

// Helper: truncate preserving whole words
function truncateWords(input: string, max: number): string {
  if (!input) return ''
  if (input.length <= max) return input
  const truncated = input.slice(0, max)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).trim() + '…'
}

// Extract plain text from portable text-like blocks
function extractPlainText(bodyText?: string) {
  if (!bodyText) return ''
  return bodyText
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Very lightweight keyword heuristic
function deriveKeywords({ categoryTitle, tags = [], rankingType }: AutoSeoInput): { focus?: string; additional?: string[] } {
  const lowered = (s?: string) => (s || '').toLowerCase()
  const baseCandidates: string[] = []
  if (categoryTitle) baseCandidates.push(`nfl ${lowered(categoryTitle)}`)
  if (rankingType) baseCandidates.push(`nfl ${lowered(rankingType.replace(/-/g, ' '))} rankings`)
  tags.slice(0, 5).forEach(t => baseCandidates.push(lowered(t)))
  const unique = [...new Set(baseCandidates.filter(Boolean))]
  const focus = unique[0]
  const additional = unique.slice(1, 6)
  return { focus, additional }
}

export function generateAutoSeo(input: AutoSeoInput): AutoSeoResult {
  const { title, summary, bodyText, existing } = input
  const plain = extractPlainText(summary || bodyText)
  const descriptionSource = summary || plain || title || ''
  const metaDescription = truncateWords(descriptionSource, 155)

  const { focus, additional } = deriveKeywords(input)

  // Meta title preference: existing override, else title enriched if necessary
  let metaTitle = existing?.metaTitle || title || ''
  if (metaTitle && metaTitle.length < 40 && focus && !metaTitle.toLowerCase().includes(focus)) {
    metaTitle = `${metaTitle} | ${focus.replace('nfl ', 'NFL ')}`.slice(0, 60)
  }

  const ogTitle = metaTitle
  const ogDescription = metaDescription

  return {
    metaTitle: truncateWords(metaTitle, 60),
    metaDescription,
    focusKeyword: focus,
    additionalKeywords: additional,
    ogTitle,
    ogDescription,
  } as AutoSeoResult & { focusKeyword?: string; additionalKeywords?: string[] }
}

// Convenience wrapper for headline documents
interface PortableBlockChild { text?: string }
interface PortableBlock { children?: PortableBlockChild[] }
interface HeadlineDocLike {
  title?: string
  summary?: string
  body?: PortableBlock[]
  category?: { title?: string }
  tags?: string[]
  seo?: Partial<AutoSeoResult>
}

export function generateHeadlineSeo(doc: HeadlineDocLike) {
  return generateAutoSeo({
    title: doc?.title,
    summary: doc?.summary,
  bodyText: doc?.body?.map(b => b.children?.map(c => c.text).join(' ')).join(' ') || '',
    categoryTitle: doc?.category?.title,
    tags: doc?.tags || [],
    existing: doc?.seo,
  })
}

// Convenience wrapper for rankings documents
interface RankingsDocLike {
  title?: string
  summary?: string
  rankingType?: string
  seo?: Partial<AutoSeoResult>
}

export function generateRankingsSeo(doc: RankingsDocLike) {
  return generateAutoSeo({
    title: doc?.title,
    summary: doc?.summary,
    rankingType: doc?.rankingType,
    existing: doc?.seo,
  })
}

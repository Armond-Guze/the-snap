// Deterministic SEO metadata for Sanity documents. This deliberately favors
// complete, specific copy over keyword stuffing, fake freshness, or ellipsis truncation.

export interface AutoSeoInput {
  title?: string
  summary?: string
  bodyText?: string
  categoryTitle?: string
  tags?: string[]
  rankingType?: string
  targetQuery?: string
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

const TITLE_LIMIT = 65
const DESCRIPTION_LIMIT = 160
const BRAND_SUFFIX = ' | The Snap'

const normalizeText = (input?: string) =>
  (input || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()

const trimAtWord = (input: string, max: number) => {
  const clean = normalizeText(input)
  if (clean.length <= max) return clean
  const slice = clean.slice(0, max + 1)
  const boundary = slice.lastIndexOf(' ')
  let result = slice
    .slice(0, boundary >= Math.floor(max * 0.6) ? boundary : max)
    .replace(/[\s,:;|–—-]+$/g, '')
    .trim()
  while (/\s+(?:a|an|and|are|as|at|be|by|could|for|from|in|is|of|on|or|the|to|with|would)$/i.test(result)) {
    result = result.replace(/\s+\S+$/, '').trim()
  }
  return result
}

const stripBrand = (title: string) =>
  title.replace(/\s*[|–—-]\s*the (?:game )?snap\s*$/i, '').trim()

const buildMetaTitle = (title?: string, focus?: string) => {
  const raw = stripBrand(normalizeText(title))
  const fallback = normalizeText(focus) || 'NFL analysis and explainers'
  let base = raw || fallback

  if (base.length > TITLE_LIMIT) {
    const [lead, ...rest] = base.split(/:\s+/)
    const detail = rest.join(': ').trim()
    const qualifier = detail.match(/\b(?:by|featuring|including|with)\s+(.+)$/i)?.[1]?.trim()
    if (lead && qualifier && lead.length < TITLE_LIMIT - 12) {
      base = `${lead}: ${trimAtWord(qualifier, TITLE_LIMIT - lead.length - 2)}`
    } else if (lead?.length >= 30 && lead.length <= TITLE_LIMIT) {
      base = lead
    } else {
      base = trimAtWord(base, TITLE_LIMIT)
    }
  }

  if (!/the (?:game )?snap/i.test(base) && base.length + BRAND_SUFFIX.length <= TITLE_LIMIT) {
    return `${base}${BRAND_SUFFIX}`
  }
  return base
}

const completeSentences = (input: string) =>
  normalizeText(input).match(/[^.!?]+[.!?]+(?:["'”’)]*)/g)?.map((sentence) => sentence.trim()) || []

const fallbackDescription = (title?: string, focus?: string) => {
  const query = normalizeText(focus).replace(/\bnfl\b/gi, 'NFL')
  if (query) {
    const candidate = `Find the key facts, context, and original analysis for ${query} from The Snap.`
    if (candidate.length <= DESCRIPTION_LIMIT) return candidate
  }
  const subject = trimAtWord(stripBrand(normalizeText(title)), 82)
  if (subject) {
    const candidate = `${subject}: get the key facts, context, and original analysis from The Snap.`
    if (candidate.length <= DESCRIPTION_LIMIT) return candidate
  }
  return 'Get the key NFL facts, context, and original analysis readers need from The Snap.'
}

const buildDescription = (source?: string, title?: string, focus?: string) => {
  const clean = normalizeText(source)
  if (!clean) return fallbackDescription(title, focus)
  if (clean.length <= DESCRIPTION_LIMIT) {
    return /[.!?]["'”’)]*$/.test(clean) ? clean : `${clean}.`
  }

  let combined = ''
  for (const sentence of completeSentences(clean)) {
    const candidate = combined ? `${combined} ${sentence}` : sentence
    if (candidate.length > DESCRIPTION_LIMIT) break
    combined = candidate
  }
  if (combined.length >= 80) return combined

  return fallbackDescription(title, focus)
}

const extractPlainText = (bodyText?: string) => normalizeText(bodyText)

function deriveKeywords({
  categoryTitle,
  tags = [],
  rankingType,
  targetQuery,
  title,
}: AutoSeoInput): { focus?: string; additional?: string[] } {
  const lower = (value?: string) => normalizeText(value).toLowerCase()
  const candidates: string[] = []
  if (targetQuery) candidates.push(lower(targetQuery))
  if (rankingType) candidates.push(`nfl ${lower(rankingType.replace(/-/g, ' '))} rankings`)
  if (categoryTitle) candidates.push(`nfl ${lower(categoryTitle)}`)
  tags.slice(0, 5).forEach((tag) => candidates.push(lower(tag)))
  if (candidates.length === 0 && title) candidates.push(lower(stripBrand(title)))

  const unique = [...new Set(candidates.filter(Boolean))]
  return {focus: unique[0], additional: unique.slice(1, 6)}
}

export function generateAutoSeo(input: AutoSeoInput): AutoSeoResult {
  const {title, summary, bodyText} = input
  const plain = extractPlainText(summary || bodyText)
  const {focus, additional} = deriveKeywords(input)
  const metaTitle = buildMetaTitle(title, focus)
  const metaDescription = buildDescription(plain, title, focus)

  return {
    metaTitle,
    metaDescription,
    focusKeyword: focus,
    additionalKeywords: additional,
    ogTitle: normalizeText(title) || metaTitle,
    ogDescription: metaDescription,
  }
}

interface PortableBlockChild { text?: string }
interface PortableBlock { children?: PortableBlockChild[] }
interface HeadlineDocLike {
  title?: string
  summary?: string
  body?: PortableBlock[]
  category?: { title?: string }
  tags?: string[]
  rankingType?: string
  editorialBrief?: {targetQuery?: string}
  seo?: Partial<AutoSeoResult>
}

export function generateHeadlineSeo(doc: HeadlineDocLike) {
  return generateAutoSeo({
    title: doc?.title,
    summary: doc?.summary,
    bodyText: doc?.body?.map((block) => block.children?.map((child) => child.text).join(' ')).join(' ') || '',
    categoryTitle: doc?.category?.title,
    tags: doc?.tags || [],
    rankingType: doc?.rankingType,
    targetQuery: doc?.editorialBrief?.targetQuery,
  })
}

export function generateRankingsSeo(doc: HeadlineDocLike) {
  return generateAutoSeo({
    title: doc?.title,
    summary: doc?.summary,
    rankingType: doc?.rankingType,
    targetQuery: doc?.editorialBrief?.targetQuery,
  })
}

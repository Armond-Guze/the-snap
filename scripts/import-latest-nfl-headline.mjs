#!/usr/bin/env node
// Import an NFL source story as an unpublished Sanity article draft.
//
// Dry-run by default:
//   npm run import:nfl-headline
//   npm run import:nfl-headline -- --site=sharp
//   npm run import:daily-sources
//   npm run import:nfl-headline -- --source-url=https://www.profootballnetwork.com/example/
//
// Create the draft:
//   npm run import:nfl-headline -- --write
//
// Requirements for draft generation:
// - OPENAI_API_KEY
// - SANITY_WRITE_TOKEN or SANITY_API_TOKEN

import crypto from 'node:crypto'
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const args = process.argv.slice(2)
const WRITE = args.includes('--write') || args.includes('--apply')
const SOURCE_ONLY = args.includes('--source-only')
const FORCE = args.includes('--force')
const INCLUDE_ARTICLE_BODY =
  !args.includes('--metadata-only') &&
  process.env.NFL_IMPORT_INCLUDE_ARTICLE_BODY !== 'false'
const RUN_FACT_VERIFICATION =
  !args.includes('--skip-fact-verification') &&
  process.env.NFL_IMPORT_FACT_VERIFICATION !== 'false'
const siteArg = (valueArg('--site') || process.env.NFL_IMPORT_SITE || 'nfl').toLowerCase()
const DAILY_BATCH = args.includes('--daily') || valueArg('--batch') === 'daily' || siteArg === 'daily'

const projectId =
  process.env.NFL_IMPORT_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset =
  process.env.NFL_IMPORT_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  'production'
const apiVersion =
  process.env.NFL_IMPORT_SANITY_API_VERSION ||
  process.env.SANITY_STUDIO_API_VERSION ||
  process.env.SANITY_API_VERSION ||
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  '2024-06-01'
const sanityToken = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN
const openaiApiKey = process.env.OPENAI_API_KEY
const openaiModel = process.env.OPENAI_MODEL || 'gpt-5.6-terra'
const newsIndexUrl = process.env.NFL_HEADLINE_SOURCE_URL || 'https://www.nfl.com/news/'
const sourceUrlArg = valueArg('--source-url')
const MIN_SOURCE_BODY_CHARS = Number.parseInt(process.env.NFL_IMPORT_MIN_SOURCE_BODY_CHARS || '600', 10)
const HEADLINE_WORDS_MIN = Number.parseInt(process.env.NFL_IMPORT_HEADLINE_WORDS_MIN || '180', 10)
const HEADLINE_WORDS_MAX = Number.parseInt(process.env.NFL_IMPORT_HEADLINE_WORDS_MAX || '600', 10)
const RICH_ARTICLE_WORDS_MIN = Number.parseInt(process.env.NFL_IMPORT_RICH_WORDS_MIN || '550', 10)
const RICH_ARTICLE_WORDS_MAX = Number.parseInt(process.env.NFL_IMPORT_RICH_WORDS_MAX || '1300', 10)
const DAILY_NFL_LIMIT = Number.parseInt(valueArg('--nfl-limit') || process.env.NFL_IMPORT_DAILY_NFL_LIMIT || '1', 10)
const DAILY_OTHER_LIMIT = Number.parseInt(valueArg('--other-limit') || process.env.NFL_IMPORT_DAILY_OTHER_LIMIT || '1', 10)
const DAILY_TOTAL_LIMIT = Number.parseInt(valueArg('--total-limit') || process.env.NFL_IMPORT_DAILY_TOTAL_LIMIT || '2', 10)
const CANDIDATE_LIMIT = Number.parseInt(valueArg('--candidate-limit') || process.env.NFL_IMPORT_CANDIDATE_LIMIT || '12', 10)
const OPENAI_MAX_RETRIES = Number.parseInt(process.env.NFL_IMPORT_OPENAI_MAX_RETRIES || '2', 10)
const OPENAI_RETRY_BASE_MS = Number.parseInt(process.env.NFL_IMPORT_OPENAI_RETRY_BASE_MS || '1500', 10)
const OPENAI_TIMEOUT_MS = Number.parseInt(process.env.NFL_IMPORT_OPENAI_TIMEOUT_MS || '90000', 10)
const MAX_SOURCE_AGE_HOURS = Number.parseInt(process.env.NFL_IMPORT_MAX_SOURCE_AGE_HOURS || '120', 10)

const WORDPRESS_FIELDS = '_fields=link,title,excerpt,content,date,date_gmt,modified,modified_gmt,yoast_head_json,categories,tags'
const SOURCE_CONFIGS = {
  nfl: {
    displayName: 'NFL.com',
    latestUrl: newsIndexUrl,
    type: 'nfl-latest',
  },
  sharp: {
    displayName: 'Sharp Football Analysis',
    latestUrl: `https://www.sharpfootballanalysis.com/wp-json/wp/v2/posts?per_page=${CANDIDATE_LIMIT}&${WORDPRESS_FIELDS}`,
    type: 'wordpress-latest',
  },
  pfn: {
    displayName: 'Pro Football Network',
    latestUrl: `https://www.profootballnetwork.com/wp-json/wp/v2/posts?per_page=${CANDIDATE_LIMIT}&${WORDPRESS_FIELDS}`,
    type: 'wordpress-latest',
  },
}

const MAX_SOURCE_BODY_CHARS = Number.parseInt(process.env.NFL_IMPORT_MAX_SOURCE_BODY_CHARS || '12000', 10)
const NFL_TEAM_SLUGS = new Set([
  'arizona-cardinals',
  'atlanta-falcons',
  'baltimore-ravens',
  'buffalo-bills',
  'carolina-panthers',
  'chicago-bears',
  'cincinnati-bengals',
  'cleveland-browns',
  'dallas-cowboys',
  'denver-broncos',
  'detroit-lions',
  'green-bay-packers',
  'houston-texans',
  'indianapolis-colts',
  'jacksonville-jaguars',
  'kansas-city-chiefs',
  'las-vegas-raiders',
  'los-angeles-chargers',
  'los-angeles-rams',
  'miami-dolphins',
  'minnesota-vikings',
  'new-england-patriots',
  'new-orleans-saints',
  'new-york-giants',
  'new-york-jets',
  'philadelphia-eagles',
  'pittsburgh-steelers',
  'san-francisco-49ers',
  'seattle-seahawks',
  'tampa-bay-buccaneers',
  'tennessee-titans',
  'washington-commanders',
])
const NFL_TEAM_ALIASES = {
  'arizona-cardinals': ['cardinals', 'ari'],
  'atlanta-falcons': ['falcons', 'atl'],
  'baltimore-ravens': ['ravens', 'bal'],
  'buffalo-bills': ['bills', 'buf'],
  'carolina-panthers': ['panthers', 'car'],
  'chicago-bears': ['bears', 'chi'],
  'cincinnati-bengals': ['bengals', 'cin'],
  'cleveland-browns': ['browns', 'cle'],
  'dallas-cowboys': ['cowboys', 'dal'],
  'denver-broncos': ['broncos', 'den'],
  'detroit-lions': ['lions', 'det'],
  'green-bay-packers': ['packers', 'gb'],
  'houston-texans': ['texans', 'hou'],
  'indianapolis-colts': ['colts', 'ind'],
  'jacksonville-jaguars': ['jaguars', 'jax'],
  'kansas-city-chiefs': ['chiefs', 'kc'],
  'las-vegas-raiders': ['raiders', 'lv'],
  'los-angeles-chargers': ['chargers', 'lac'],
  'los-angeles-rams': ['rams', 'lar'],
  'miami-dolphins': ['dolphins', 'mia'],
  'minnesota-vikings': ['vikings', 'min'],
  'new-england-patriots': ['patriots', 'ne'],
  'new-orleans-saints': ['saints', 'no'],
  'new-york-giants': ['giants', 'nyg'],
  'new-york-jets': ['jets', 'nyj'],
  'philadelphia-eagles': ['eagles', 'phi'],
  'pittsburgh-steelers': ['steelers', 'pit'],
  'san-francisco-49ers': ['49ers', 'niners', 'sf'],
  'seattle-seahawks': ['seahawks', 'sea'],
  'tampa-bay-buccaneers': ['buccaneers', 'bucs', 'tb'],
  'tennessee-titans': ['titans', 'ten'],
  'washington-commanders': ['commanders', 'was'],
}
const TRAILING_TITLE_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])
const PROMO_OR_AD_PATTERN =
  /\b(advertisement|sponsored|sponsor|partner content|promo|promotion|discount|coupon|sale|shop|merch|tickets?|giveaway|sweepstakes|subscribe|subscription|newsletter|sign up|download|available now|now available|new book|ebook|course|webinar|book excerpt|excerpt from|warren sharp'?s \d{4} football)\b/i
const LOW_VALUE_STORY_PATTERN =
  /\b(relationship|dating|romance|personal life|knew about|bodycam|traffic stop|reporter|media personality|fabricated|rips?|reacts? to|nfl world reacts)\b/i
const YOUTH_FOOTBALL_PATTERN =
  /\b(nfl flag|flag football|youth football|girls'? flag|boys'? flag|high school|middle school|u-?\d{1,2}|under-\d{1,2})\b/i
const SENSITIVE_STORY_PATTERN =
  /\b(dies?|dead|death|obituary|passes away|arrest|charged|criminal|lawsuit|sexual assault|domestic violence|ownership succession)\b/i
const UNSUPPORTED_AUTOMATION_FORMAT_PATTERN =
  /\b(top 100|nos?\.\s*\d+\s*[-–]\s*\d+|power rankings?|mock draft|rankings?\s*[:\-]|team totals? tool|odds table)\b/i
const GENERIC_SPECULATION_PATTERN =
  /\b(raises? questions?|remains to be seen|time will tell|worth monitoring|bears watching|could have implications|may have implications|could reshape|could signal)\b/i
const FOOTBALL_RELEVANCE_PATTERN =
  /\b(nfl|football|quarterback|qb|running back|wide receiver|receiver|tight end|offensive line|defensive line|cornerback|safety|linebacker|coach|coordinator|roster|depth chart|training camp|minicamp|preseason|regular season|playoffs?|super bowl|draft|free agency|trade|contract|injury|fantasy|betting|odds|rankings?|analysis|seahawks?|rams?|bills?|chiefs?|cowboys?|eagles?|ravens?|bengals?|lions?|packers?|49ers?|niners?|steelers?|patriots?|jets?|giants?|dolphins?|bears?|vikings?|saints?|falcons?|buccaneers?|bucs?|chargers?|raiders?|broncos?|texans?|colts?|jaguars?|titans?|browns?|cardinals?|panthers?|commanders?)\b/i

if (!projectId || !dataset) {
  console.error('Missing Sanity projectId/dataset in env.')
  process.exit(1)
}

if (WRITE && !sanityToken) {
  console.error('Missing Sanity write token. Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN.')
  process.exit(1)
}

if (!SOURCE_ONLY && !openaiApiKey) {
  console.error('Missing OPENAI_API_KEY. Run with --source-only to test the NFL.com fetch without AI generation.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: sanityToken,
  useCdn: false,
})

function valueArg(name) {
  const direct = args.find((arg) => arg.startsWith(`${name}=`))
  if (direct) return direct.slice(name.length + 1)
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function compact(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toIsoDate(value) {
  const parsed = Date.parse(compact(value))
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : ''
}

function redactSecrets(value) {
  return String(value || '').replace(/sk-[A-Za-z0-9_*.-]+/g, 'sk-REDACTED')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryDelayMs(attempt) {
  const jitter = Math.floor(Math.random() * 250)
  return OPENAI_RETRY_BASE_MS * 2 ** Math.max(0, attempt - 1) + jitter
}

function retryableOpenAIStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500
}

function retryableOpenAIError(error) {
  if (error?.name === 'AbortError' || error?.cause?.name === 'AbortError') return true
  return /fetch failed|network|timeout|timed out|econnreset|etimedout|socket|aborted/i.test(String(error?.message || error))
}

async function fetchOpenAIResponse(body) {
  const attempts = Math.max(1, OPENAI_MAX_RETRIES + 1)
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${openaiApiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => ({}))

      if (response.ok || !retryableOpenAIStatus(response.status) || attempt === attempts) {
        return { response, payload }
      }

      const delay = retryDelayMs(attempt)
      console.warn(`OpenAI request failed with retryable status ${response.status}; retrying in ${delay}ms (${attempt}/${attempts - 1}).`)
      await sleep(delay)
    } catch (error) {
      lastError = error
      if (!retryableOpenAIError(error) || attempt === attempts) throw error

      const delay = retryDelayMs(attempt)
      console.warn(`OpenAI request failed: ${redactSecrets(error.message || error)}; retrying in ${delay}ms (${attempt}/${attempts - 1}).`)
      await sleep(delay)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error('OpenAI request failed.')
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return String(value || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body) => {
    const lower = body.toLowerCase()
    if (lower[0] === '#') {
      const codePoint = lower[1] === 'x'
        ? Number.parseInt(lower.slice(2), 16)
        : Number.parseInt(lower.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity
    }
    return named[lower] || entity
  })
}

function htmlAttr(tag, name) {
  const match = tag.match(new RegExp(`${name}=(["'])(.*?)\\1`, 'i'))
  return match ? decodeHtmlEntities(match[2]) : ''
}

function stripHtml(value) {
  return compact(
    decodeHtmlEntities(String(value || ''))
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function sourceNameForUrl(url) {
  const hostname = new URL(url).hostname.replace(/^www\./, '')
  if (hostname === 'nfl.com') return 'NFL.com'
  if (hostname === 'sharpfootballanalysis.com') return 'Sharp Football Analysis'
  if (hostname === 'profootballnetwork.com') return 'Pro Football Network'
  return hostname
}

function normalizeSourceUrl(url) {
  const parsed = new URL(url)
  parsed.hash = ''
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|ref$|source$)/i.test(key)) parsed.searchParams.delete(key)
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/'
  return parsed.toString()
}

function safeCanonicalUrl(candidate, fallbackUrl) {
  try {
    const candidateUrl = new URL(candidate, fallbackUrl)
    const fallback = new URL(fallbackUrl)
    const candidateHost = candidateUrl.hostname.replace(/^www\./, '')
    const fallbackHost = fallback.hostname.replace(/^www\./, '')
    const allowedHosts = new Set(['nfl.com', 'sharpfootballanalysis.com', 'profootballnetwork.com'])
    if (!allowedHosts.has(candidateHost) || candidateHost !== fallbackHost) return normalizeSourceUrl(fallback.toString())
    return normalizeSourceUrl(candidateUrl.toString())
  } catch {
    return normalizeSourceUrl(fallbackUrl)
  }
}

function wordpressApiUrlFromArticleUrl(url) {
  const parsed = new URL(url)
  const slug = parsed.pathname.split('/').filter(Boolean).at(-1)
  if (!slug) return ''
  return `${parsed.origin}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&${WORDPRESS_FIELDS}`
}

function slugify(value, maxLength = 96) {
  const slug = compact(value)
    .toLowerCase()
    .replace(/['"“”‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+$/g, '')
  if (slug.length <= maxLength) return slug

  const truncated = slug.slice(0, maxLength).replace(/-[^-]*$/, '').replace(/-+$/g, '')
  return truncated.length >= 24 ? truncated : slug.slice(0, maxLength).replace(/-+$/g, '')
}

function truncateAtWord(value, maxLength) {
  const text = compact(value)
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  const candidate = (
    text.length > maxLength && lastSpace > 20
      ? truncated.slice(0, lastSpace)
      : truncated
  ).trim().replace(/[,:;/-]+$/, '')
  const words = candidate.split(' ')
  while (
    words.length > 1 &&
    (words.at(-1).length === 1 || TRAILING_TITLE_STOP_WORDS.has(words.at(-1).toLowerCase()))
  ) {
    words.pop()
  }
  return words.join(' ').trim().replace(/[,:;/-]+$/, '')
}

function stableKey(seed = '') {
  return crypto.createHash('sha1').update(`${seed}:${crypto.randomUUID()}`).digest('hex').slice(0, 12)
}

function reference(id) {
  return {
    _type: 'reference',
    _key: stableKey(id),
    _ref: id,
  }
}

function sourceBaseId(url) {
  const parsed = new URL(normalizeSourceUrl(url))
  const tail = slugify(parsed.pathname.split('/').filter(Boolean).at(-1) || 'headline', 72)
  const hash = crypto.createHash('sha1').update(parsed.toString()).digest('hex').slice(0, 10)
  let sourcePrefix = slugify(parsed.hostname.replace(/^www\./, '').replace(/\.com$/, ''), 28)
  if (parsed.hostname.replace(/^www\./, '') === 'nfl.com') sourcePrefix = 'nfl'
  if (parsed.hostname.replace(/^www\./, '') === 'profootballnetwork.com') sourcePrefix = 'pfn'
  if (parsed.hostname.replace(/^www\./, '') === 'sharpfootballanalysis.com') sourcePrefix = 'sharp'
  return `auto-${sourcePrefix || 'source'}-${tail || 'headline'}-${hash}`
}

async function fetchText(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'TheSnapHeadlineImporter/1.0 (+https://thegamesnap.com)',
      },
      signal: controller.signal,
    })
    const text = await response.text()
    if (!response.ok) {
      throw new Error(`Request failed ${response.status} for ${url}: ${text.slice(0, 240)}`)
    }
    return text
  } finally {
    clearTimeout(timeout)
  }
}

function parseLatestCards(html) {
  const cards = []
  const anchorRegex = /<a\b[^>]*data-link_type=(["'])Latest News\1[^>]*>/gi
  let match

  while ((match = anchorRegex.exec(html))) {
    const tag = match[0]
    const url = htmlAttr(tag, 'data-link_url') || htmlAttr(tag, 'href')
    if (!url || !url.startsWith('/news/') || url.includes('/series/') || url === '/news/all-news') continue

    const title = compact(htmlAttr(tag, 'data-link_name') || htmlAttr(tag, 'title') || htmlAttr(tag, 'aria-label'))
    if (!title || title.includes('/news/all-news')) continue

    const position = htmlAttr(tag, 'data-link_position')
    const order = Number.parseInt(position.split(':')[0] || '', 10)
    cards.push({
      title,
      url: new URL(url, 'https://www.nfl.com').toString(),
      order: Number.isFinite(order) ? order : cards.length + 1,
    })
  }

  const seen = new Set()
  return cards
    .sort((a, b) => a.order - b.order)
    .filter((card) => {
      if (seen.has(card.url)) return false
      seen.add(card.url)
      return true
    })
}

function parseJsonLd(html) {
  function findArticle(value) {
    if (!value || typeof value !== 'object') return null
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findArticle(item)
        if (found) return found
      }
      return null
    }

    if (/NewsArticle|Article/i.test(String(value?.['@type'] || ''))) return value
    if (Array.isArray(value['@graph'])) return findArticle(value['@graph'])
    return null
  }

  const scripts = [...html.matchAll(/<script\s+type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, , raw] of scripts) {
    try {
      const parsed = JSON.parse(raw.trim())
      const article = findArticle(parsed)
      if (article) return article
    } catch {
      // Keep trying other JSON-LD blocks.
    }
  }
  return null
}

function metaContent(html, attr, value) {
  const regex = new RegExp(`<meta\\b(?=[^>]*\\b${attr}=(["'])${escapeRegex(value)}\\1)[^>]*>`, 'i')
  const tag = html.match(regex)?.[0]
  return tag ? compact(htmlAttr(tag, 'content')) : ''
}

function linkHref(html, rel) {
  const regex = new RegExp(`<link\\b(?=[^>]*\\brel=(["'])${escapeRegex(rel)}\\1)[^>]*>`, 'i')
  const tag = html.match(regex)?.[0]
  return tag ? compact(htmlAttr(tag, 'href')) : ''
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.map(compact).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map(compact).filter(Boolean)
  return []
}

async function fetchNewestSource() {
  if (sourceUrlArg) {
    return fetchArticleSource(new URL(sourceUrlArg, 'https://www.nfl.com').toString())
  }

  const config = SOURCE_CONFIGS[siteArg]
  if (!config) {
    throw new Error(`Unsupported site "${siteArg}". Use one of: ${Object.keys(SOURCE_CONFIGS).join(', ')}`)
  }

  if (config.type === 'wordpress-latest') {
    return fetchWordPressLatestSource(config)
  }

  if (config.type === 'nfl-latest') {
    const indexHtml = await fetchText(config.latestUrl)
    const latestCards = parseLatestCards(indexHtml)
    if (latestCards.length === 0) {
      throw new Error(`No Latest News cards found at ${config.latestUrl}. ${config.displayName} markup may have changed.`)
    }
    return fetchArticleSource(latestCards[0].url, { listingTitle: latestCards[0].title, sourceName: config.displayName })
  }

  throw new Error(`Unsupported source type "${config.type}"`)
}

async function fetchCandidateSources(site, limit) {
  const config = SOURCE_CONFIGS[site]
  if (!config) throw new Error(`Unsupported site "${site}"`)

  if (config.type === 'nfl-latest') return fetchNflCandidateSources(config, limit)
  if (config.type === 'wordpress-latest') return fetchWordPressCandidateSources(config, limit)

  throw new Error(`Unsupported source type "${config.type}"`)
}

async function fetchNflCandidateSources(config, limit) {
  const indexHtml = await fetchText(config.latestUrl)
  const latestCards = parseLatestCards(indexHtml).slice(0, limit)
  const sources = []

  for (const card of latestCards) {
    try {
      sources.push(await fetchArticleSource(card.url, { listingTitle: card.title, sourceName: config.displayName }))
    } catch (error) {
      console.log(`Skipped ${card.url}: ${error.message || error}`)
    }
  }

  return sources
}

async function fetchWordPressCandidateSources(config, limit) {
  const payload = JSON.parse(await fetchText(config.latestUrl))
  const posts = (Array.isArray(payload) ? payload : []).slice(0, limit)
  return posts.map((post) => sourceFromWordPressPost(post, config.displayName)).filter((source) => source.url)
}

async function fetchWordPressLatestSource(config) {
  const payload = JSON.parse(await fetchText(config.latestUrl))
  const post = Array.isArray(payload) ? payload[0] : null
  if (!post) throw new Error(`No latest WordPress post found for ${config.displayName}`)
  return sourceFromWordPressPost(post, config.displayName)
}

async function fetchArticleSource(articleUrl, fallback = {}) {
  const sourceName = fallback.sourceName || sourceNameForUrl(articleUrl)
  const wordpressApiUrl = wordpressApiUrlFromArticleUrl(articleUrl)

  if (wordpressApiUrl && /sharpfootballanalysis\.com|profootballnetwork\.com/.test(new URL(articleUrl).hostname)) {
    const payload = JSON.parse(await fetchText(wordpressApiUrl))
    const post = Array.isArray(payload) ? payload[0] : null
    if (post) return sourceFromWordPressPost(post, sourceName)
  }

  return fetchHtmlArticleSource(articleUrl, fallback)
}

function sourceFromWordPressPost(post, sourceName) {
  const yoast = post.yoast_head_json || {}
  const rawUrl = compact(post.link || yoast.canonical)
  const url = rawUrl ? safeCanonicalUrl(yoast.canonical || rawUrl, rawUrl) : ''
  const title = stripHtml(post.title?.rendered || yoast.title || '')
  const description = stripHtml(post.excerpt?.rendered || yoast.description || yoast.og_description || '')
  const rawBody = stripHtml(post.content?.rendered || '')

  return {
    title,
    description,
    url,
    datePublished: toIsoDate(post.date_gmt ? `${post.date_gmt}Z` : post.date || yoast.article_published_time),
    dateModified: toIsoDate(post.modified_gmt ? `${post.modified_gmt}Z` : post.modified || yoast.article_modified_time),
    author: compact(yoast.author || ''),
    articleSection: compact(yoast.article_section || ''),
    keywords: normalizeStringArray(yoast.keywords),
    image: compact(yoast.og_image?.[0]?.url || yoast.twitter_image || ''),
    sourceName,
    bodyExcerpt: INCLUDE_ARTICLE_BODY ? rawBody.slice(0, MAX_SOURCE_BODY_CHARS) : '',
  }
}

function sourceSkipReason(source) {
  const text = `${source.title || ''} ${source.description || ''} ${source.articleSection || ''} ${source.url || ''}`
  if (!compact(source.title) || !compact(source.url)) return 'missing title or URL'
  if (PROMO_OR_AD_PATTERN.test(text)) return 'promo/ad-like source'
  if (LOW_VALUE_STORY_PATTERN.test(text)) return 'low-football-value source'
  if (YOUTH_FOOTBALL_PATTERN.test(`${text} ${source.bodyExcerpt || ''}`)) return 'youth/flag story requires a separate editorial workflow'
  if (SENSITIVE_STORY_PATTERN.test(text)) return 'sensitive story requires manual reporting and review'
  if (UNSUPPORTED_AUTOMATION_FORMAT_PATTERN.test(text)) return 'ranking/table format is not safely supported by this importer'
  if (!FOOTBALL_RELEVANCE_PATTERN.test(text)) return 'not clearly football-related'
  if (!SOURCE_ONLY && compact(source.bodyExcerpt).length < MIN_SOURCE_BODY_CHARS) {
    return `source body extraction returned fewer than ${MIN_SOURCE_BODY_CHARS} characters`
  }
  if (MAX_SOURCE_AGE_HOURS > 0 && source.datePublished) {
    const publishedAt = Date.parse(source.datePublished)
    const ageHours = (Date.now() - publishedAt) / 3_600_000
    if (Number.isFinite(ageHours) && ageHours > MAX_SOURCE_AGE_HOURS) {
      return `source is ${Math.floor(ageHours)} hours old (limit: ${MAX_SOURCE_AGE_HOURS})`
    }
  }
  return ''
}

async function fetchHtmlArticleSource(articleUrl, fallback = {}) {
  const articleHtml = await fetchText(articleUrl)
  const jsonLd = parseJsonLd(articleHtml) || {}
  const canonicalUrl = safeCanonicalUrl(jsonLd.url || linkHref(articleHtml, 'canonical') || articleUrl, articleUrl)
  const rawBody = compact(jsonLd.articleBody || '')
  const sourceName = fallback.sourceName || sourceNameForUrl(canonicalUrl)

  return {
    title:
      compact(jsonLd.headline) ||
      metaContent(articleHtml, 'property', 'og:title') ||
      metaContent(articleHtml, 'name', 'twitter:title') ||
      fallback.listingTitle,
    description:
      compact(jsonLd.description) ||
      metaContent(articleHtml, 'property', 'og:description') ||
      metaContent(articleHtml, 'name', 'description'),
    url: canonicalUrl,
    datePublished: compact(jsonLd.datePublished),
    dateModified: compact(jsonLd.dateModified),
    author: compact(jsonLd.author?.name || normalizeStringArray(jsonLd.creator)[0]),
    articleSection: compact(jsonLd.articleSection),
    keywords: normalizeStringArray(jsonLd.keywords),
    image:
      compact(jsonLd.thumbnailUrl) ||
      normalizeStringArray(jsonLd.image)[0] ||
      metaContent(articleHtml, 'property', 'og:image'),
    sourceName,
    bodyExcerpt: INCLUDE_ARTICLE_BODY ? rawBody.slice(0, MAX_SOURCE_BODY_CHARS) : '',
  }
}

async function fetchSanityIndexes() {
  return client.fetch(`{
    "authors": *[_type == "author" && !(_id in path("drafts.**"))] | order(name asc){_id,name,"slug":slug.current},
    "categories": *[_type == "category" && !(_id in path("drafts.**"))] | order(title asc){_id,title,"slug":slug.current},
    "teams": *[_type == "tag" && !(_id in path("drafts.**"))] | order(title asc){_id,title,"slug":slug.current,aliases},
    "topicHubs": *[_type == "topicHub" && !(_id in path("drafts.**"))] | order(title asc){_id,title,"slug":slug.current},
    "tagRefs": *[_type == "advancedTag" && !(_id in path("drafts.**"))] | order(title asc){_id,title,"slug":slug.current,aliases},
    "players": *[_type == "player" && !(_id in path("drafts.**"))] | order(name asc)[0...1200]{_id,name,"slug":slug.current},
    "recentArticles": *[
      _type == "article" &&
      coalesce(date, _createdAt) > now() - 60*60*24*45
    ] | order(coalesce(date, _createdAt) desc)[0...250]{
      _id,
      title,
      homepageTitle,
      "slug": slug.current,
      "sourceUrl": automationImport.sourceUrl
    },
    "importsToday": *[
      _type == "article" &&
      defined(automationImport.ingestedAt) &&
      automationImport.ingestedAt >= $dayStart
    ]{
      "sourceName": automationImport.sourceName
    }
  }`, { dayStart: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString() })
}

function bySlug(items) {
  return new Map((items || []).filter((item) => item?.slug).map((item) => [item.slug, item]))
}

function byNormalizedName(items, field = 'title') {
  const map = new Map()
  for (const item of items || []) {
    const name = normalizeName(item?.[field])
    if (name) map.set(name, item)
  }
  return map
}

function normalizeName(value) {
  return compact(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function existingBySlug(items, slugs, max = Infinity) {
  const index = bySlug(items)
  const refs = []
  const seen = new Set()
  for (const slug of slugs || []) {
    const item = index.get(slug)
    if (!item || seen.has(item._id)) continue
    seen.add(item._id)
    refs.push(reference(item._id))
    if (refs.length >= max) break
  }
  return refs
}

function teamDocs(items) {
  return (items || []).filter((item) => NFL_TEAM_SLUGS.has(item?.slug))
}

function inferTeamSlugs(source, teams, options = {}) {
  const includeKeywords = options.includeKeywords === true
  const rawText = [
    source.title,
    source.description,
    source.articleSection,
    ...(includeKeywords ? source.keywords || [] : []),
  ].join(' ')
  if (YOUTH_FOOTBALL_PATTERN.test(`${rawText} ${source.bodyExcerpt || ''}`)) return []
  const text = normalizeName(rawText)
  const matches = []

  for (const team of teams || []) {
    const names = [
      team.title,
      team.slug,
      ...(team.aliases || []),
      ...(NFL_TEAM_ALIASES[team.slug] || []),
    ]
      .map(normalizeName)
      .filter((name) => name.length >= 5 && !/^(no|was|car|ari|atl|bal|buf|chi|cin|cle|dal|den|det|hou|ind|jax|lar|lac|mia|min|nyg|nyj|phi|pit|sea|ten)$/.test(name))
    if (names.some((name) => new RegExp(`(^| )${escapeRegex(name)}( |$)`).test(text))) matches.push(team.slug)
  }

  return matches
}

function inferTagSlugs(source, allowedTagSlugs) {
  const text = [
    source.title,
    source.description,
    source.articleSection,
    ...(source.keywords || []),
  ].join(' ')
  const rules = [
    ['nfl', /\bnfl\b|football/i],
    ['roster-moves', /\bsign|release|waive|trade|free agent|roster|contract|extension|departure/i],
    ['nfl-offseason-moves', /\boffseason|sign|release|waive|trade|free agent|contract|extension/i],
    ['injury-report', /\binjur|surgery|ankle|knee|hamstring|shoulder|calf|concussion/i],
    ['nfl-suspensions', /\bsuspend|discipline|appeal/i],
    ['player-discipline', /\bsuspend|discipline|locker room|conduct/i],
    ['quarterbacks', /\bqb\b|quarterback/i],
    ['qb-watch', /\bqb\b|quarterback|starter/i],
    ['nfl-top-100', /\btop 100\b/i],
    ['player-rankings', /\branking|rankings|top \d+/i],
    ['nfl-free-agency', /\bfree agent|free agency|contract|sign/i],
    ['nfl-draft', /\bdraft|rookie|prospect/i],
    ['training-camp', /\btraining camp|camp|practice|otas|minicamp/i],
    ['preseason', /\bpreseason|hall of fame game/i],
  ]

  const slugs = []
  for (const [slug, pattern] of rules) {
    if (allowedTagSlugs.has(slug) && pattern.test(text)) slugs.push(slug)
  }
  return slugs
}

function inferHubSlugs(source, allowedHubSlugs) {
  const text = [
    source.title,
    source.description,
    source.articleSection,
    ...(source.keywords || []),
  ].join(' ')
  const rules = [
    ['nfl-offseason', /\boffseason|free agent|contract|sign|release|trade|roster/i],
    ['nfl-regular-season', /\bgame|week|season|starter|matchup|vs\b/i],
    ['nfl-training-camp', /\btraining camp|camp|practice|otas|minicamp/i],
    ['nfl-preseason', /\bpreseason|hall of fame game/i],
    ['nfl-free-agency', /\bfree agent|free agency|contract|sign/i],
    ['nfl-power-rankings', /\branking|rankings|top 100|power rankings/i],
    ['draft', /\bdraft|rookie|prospect/i],
  ]

  const slugs = []
  for (const [slug, pattern] of rules) {
    if (allowedHubSlugs.has(slug) && pattern.test(text)) slugs.push(slug)
  }
  return slugs
}

function draftSchema(allowed) {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'title',
      'homepageTitle',
      'summary',
      'format',
      'categorySlug',
      'relatedPlayers',
      'teamSlugs',
      'topicHubSlugs',
      'tagSlugs',
      'imageIdea',
      'sourceFacts',
      'editorialValue',
      'body',
    ],
    properties: {
      title: { type: 'string', minLength: 12, maxLength: 120 },
      homepageTitle: { type: 'string', minLength: 8, maxLength: 65 },
      summary: { type: 'string', minLength: 90, maxLength: 240 },
      format: { type: 'string', enum: ['headline', 'feature', 'fantasy', 'analysis', 'ranking'] },
      categorySlug: { type: 'string', enum: allowed.categorySlugs },
      relatedPlayers: {
        type: 'array',
        items: { type: 'string', maxLength: 80 },
        maxItems: 8,
      },
      teamSlugs: {
        type: 'array',
        items: { type: 'string', enum: allowed.teamSlugs },
        maxItems: 6,
      },
      topicHubSlugs: {
        type: 'array',
        items: { type: 'string', enum: allowed.topicHubSlugs },
        maxItems: 3,
      },
      tagSlugs: {
        type: 'array',
        items: { type: 'string', enum: allowed.tagSlugs },
        minItems: 0,
        maxItems: 6,
      },
      imageIdea: { type: 'string', minLength: 20, maxLength: 220 },
      sourceFacts: {
        type: 'array',
        minItems: 4,
        maxItems: 12,
        items: { type: 'string', minLength: 12, maxLength: 260 },
      },
      editorialValue: { type: 'string', minLength: 40, maxLength: 280 },
      body: {
        type: 'array',
        minItems: 5,
        maxItems: 30,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['style', 'text', 'listItem'],
          properties: {
            style: { type: 'string', enum: ['normal', 'h2', 'h3'] },
            text: { type: 'string', minLength: 8, maxLength: 900 },
            listItem: { type: ['string', 'null'], enum: ['bullet', null] },
          },
        },
      },
    },
  }
}

async function generateDraft(source, indexes) {
  const teams = teamDocs(indexes.teams)
  const allowed = {
    categorySlugs: (indexes.categories || []).map((item) => item.slug).filter(Boolean),
    teamSlugs: teams.map((item) => item.slug).filter(Boolean),
    topicHubSlugs: (indexes.topicHubs || []).map((item) => item.slug).filter(Boolean),
    tagSlugs: (indexes.tagRefs || []).map((item) => item.slug).filter(Boolean),
  }

  const fallbackTags = inferTagSlugs(source, new Set(allowed.tagSlugs))
  const fallbackHubs = inferHubSlugs(source, new Set(allowed.topicHubSlugs))
  const fallbackTeams = inferTeamSlugs(source, teams)

  const promptPayload = {
    source: {
      title: source.title,
      description: source.description,
      url: source.url,
      datePublished: source.datePublished,
      author: source.author,
      articleSection: source.articleSection,
      keywords: source.keywords,
      bodyExcerpt: source.bodyExcerpt,
    },
    allowed,
    fallbackSuggestions: {
      format: inferFormat(source),
      categorySlug: allowed.categorySlugs.includes('headlines') ? 'headlines' : allowed.categorySlugs[0],
      teamSlugs: fallbackTeams,
      topicHubSlugs: fallbackHubs,
      tagSlugs: fallbackTags,
    },
  }

  const { response, payload } = await fetchOpenAIResponse({
    model: openaiModel,
    reasoning: { effort: 'medium' },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              `You create original, unpublished THE SNAP NFL drafts for an editor. Treat the supplied source text as the complete factual boundary: every name, number, date, quote, team-player relationship, causal claim, and historical statement must be directly supported there. Never fill gaps with plausible context, speculation, generic industry claims, or outside knowledge. Do not copy sentence structure, paragraph order, or distinctive phrasing. A concise accurate draft is better than a padded one. Headline drafts should generally be ${HEADLINE_WORDS_MIN}-${HEADLINE_WORDS_MAX} words. Analysis, fantasy, or feature drafts may be ${RICH_ARTICLE_WORDS_MIN}-${RICH_ARTICLE_WORDS_MAX} words only when the supplied material supports that depth. SourceFacts must list at least four concrete facts traceable to the source. EditorialValue must state the specific utility this draft actually delivers beyond restating the headline; do not claim value the body does not contain. Body headings must use real h2/h3 style values, never Markdown. Do not include raw URLs.`,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              `Create an original unpublished THE SNAP draft from this ${source.sourceName || 'NFL'} source. Return only JSON matching the schema. Lead with the verified news or answer. Use short paragraphs and only as many h2 sections as help the reader. Choose fantasy only when the source explicitly has fantasy/DFS intent. Never turn a partial list into a complete ranking, and never imply a tool, table, dataset, quote, or reporting that is not present. Use only existing category/tag/team/topic-hub slugs. Do not select a team merely because a short abbreviation or youth team shares an NFL nickname.\n\n` +
              JSON.stringify(promptPayload),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'snap_headline_draft',
        strict: true,
        schema: draftSchema(allowed),
      },
    },
  })

  if (!response.ok) {
    throw new Error(redactSecrets(payload?.error?.message || `OpenAI request failed with status ${response.status}`))
  }

  const outputText = extractResponseText(payload)
  if (!outputText) throw new Error('OpenAI response did not include output text.')

  return normalizeGeneratedDraft(JSON.parse(outputText), source, indexes)
}

function extractResponseText(payload) {
  if (payload.output_text) return payload.output_text

  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || '')
    .filter(Boolean)
    .join('\n')
}

function normalizeGeneratedDraft(draft, source, indexes) {
  const categoryBySlug = bySlug(indexes.categories)
  const allowedTagSlugs = new Set((indexes.tagRefs || []).map((item) => item.slug).filter(Boolean))
  const allowedHubSlugs = new Set((indexes.topicHubs || []).map((item) => item.slug).filter(Boolean))
  const allowedTeamSlugs = new Set(teamDocs(indexes.teams).map((item) => item.slug).filter(Boolean))

  const tagSlugs = uniqueStrings([
    ...(draft.tagSlugs || []),
    ...inferTagSlugs(source, allowedTagSlugs),
    'nfl',
  ]).filter((slug) => allowedTagSlugs.has(slug)).slice(0, 6)

  const hubSlugs = uniqueStrings([
    ...(draft.topicHubSlugs || []),
    ...inferHubSlugs(source, allowedHubSlugs),
  ]).filter((slug) => allowedHubSlugs.has(slug)).slice(0, 3)

  return {
    ...draft,
    title: truncateAtWord(draft.title || source.title, 120),
    homepageTitle: truncateAtWord(draft.homepageTitle || draft.title || source.title, 65),
    summary: completeSummary(draft.summary || source.description, 240),
    format: normalizeFormat(draft.format, source),
    categorySlug: normalizeCategorySlug(draft.categorySlug, source, categoryBySlug),
    tagSlugs,
    topicHubSlugs: hubSlugs,
    teamSlugs: inferTeamSlugs(source, teamDocs(indexes.teams))
      .filter((slug) => allowedTeamSlugs.has(slug))
      .slice(0, 3),
    relatedPlayers: uniqueStrings(draft.relatedPlayers || []).slice(0, 8),
    imageIdea: compact(draft.imageIdea),
    sourceFacts: uniqueStrings(draft.sourceFacts || []).slice(0, 12),
    editorialValue: compact(draft.editorialValue),
    body: cleanBodyBlocks(draft.body || []),
  }
}

function inferFormat(source) {
  return normalizeFormat('', source)
}

function normalizeFormat(_format, source) {
  const text = `${source.title || ''} ${source.description || ''} ${source.articleSection || ''}`

  if (/\b(fantasy|dfs|adp|waiver|start[ /-]sit|best ball)\b/i.test(text)) return 'fantasy'
  if (/\brank(ing|ings|ed)?\b|\btop\s+\d+\b|\bbest rosters?\b|\bhot list\b/i.test(text)) return 'ranking'
  if (/\bwhy\b|\banalysis\b|\bwhat it means\b|\bpreview\b|\boutlook\b|\bprojection\b|\bexplained\b/i.test(text)) {
    return 'analysis'
  }
  if (/\bguide\b|\bbook\b|\bdownload\b|\bevergreen\b/i.test(text)) return 'feature'

  return 'headline'
}

function normalizeCategorySlug(categorySlug, source, categoryBySlug) {
  const selected = categoryBySlug.has(categorySlug) ? categorySlug : 'headlines'
  const text = `${source.title || ''} ${source.description || ''}`

  if (/\bpower rankings?\b/i.test(text) && categoryBySlug.has('power-rankings')) return 'power-rankings'
  if (/\brank(ing|ings|ed)?\b|\btop\s+\d+\b|\bbest rosters?\b/i.test(text) && categoryBySlug.has('rankings')) {
    return 'rankings'
  }
  if (/\bfantasy\b/i.test(text) && categoryBySlug.has('fantasy')) return 'fantasy'
  if (/\bplayer news\b|\binjury\b|\bsign|trade|release|contract|roster\b/i.test(text) && categoryBySlug.has('player-news')) {
    return 'player-news'
  }

  return selected
}

function uniqueStrings(values) {
  const seen = new Set()
  const next = []
  for (const value of values || []) {
    const cleaned = compact(value)
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    next.push(cleaned)
  }
  return next
}

function completeSummary(value, maxLength = 240) {
  const text = compact(value)
  if (!text) return ''
  if (text.length <= maxLength) {
    const cleaned = text.replace(/[,;:\-–—]+$/, '').trim()
    return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
  }

  const withinLimit = text.slice(0, maxLength + 1)
  const sentenceEnds = [...withinLimit.matchAll(/[.!?](?=\s|$)/g)]
  const lastSentenceEnd = sentenceEnds.at(-1)?.index
  if (typeof lastSentenceEnd === 'number' && lastSentenceEnd >= 89) {
    return withinLimit.slice(0, lastSentenceEnd + 1).trim()
  }

  const truncated = truncateAtWord(withinLimit, maxLength).replace(/[,;:\-–—]+$/, '').trim()
  return /[.!?]$/.test(truncated) ? truncated : `${truncated}.`
}

function cleanBodyBlocks(blocks) {
  return blocks
    .map((block) => ({
      style: ['normal', 'h2', 'h3'].includes(block?.style) ? block.style : 'normal',
      text: compact(block?.text).replace(/^#{1,6}\s+/, ''),
      listItem: block?.listItem === 'bullet' ? 'bullet' : null,
    }))
    .filter((block) => block.text)
}

function draftBodyText(draft) {
  return (draft.body || [])
    .filter((block) => block.style === 'normal')
    .map((block) => compact(block.text))
    .filter(Boolean)
    .join(' ')
}

function wordCount(value) {
  return compact(value).split(/\s+/).filter(Boolean).length
}

function normalizedWords(value) {
  return compact(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.%$-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function copiedShingleStats(draft, source, size = 12) {
  const sourceWords = normalizedWords(source.bodyExcerpt)
  const draftWords = normalizedWords(draftBodyText(draft))
  if (sourceWords.length < size || draftWords.length < size) return { matches: 0, ratio: 0 }

  const sourceShingles = new Set()
  for (let index = 0; index <= sourceWords.length - size; index += 1) {
    sourceShingles.add(sourceWords.slice(index, index + size).join(' '))
  }

  let matches = 0
  const total = draftWords.length - size + 1
  for (let index = 0; index <= draftWords.length - size; index += 1) {
    if (sourceShingles.has(draftWords.slice(index, index + size).join(' '))) matches += 1
  }
  return { matches, ratio: total > 0 ? matches / total : 0 }
}

function unsupportedNumbers(draft, source) {
  const sourceNumbers = new Set(
    `${source.title || ''} ${source.description || ''} ${source.bodyExcerpt || ''}`
      .match(/\b\d[\d,.%$-]*\b/g) || []
  )
  const draftNumbers = uniqueStrings(
    `${draft.title || ''} ${draft.summary || ''} ${draftBodyText(draft)}`
      .match(/\b\d[\d,.%$-]*\b/g) || []
  )
  return draftNumbers.filter((number) => !sourceNumbers.has(number))
}

function repeatedBodyBlock(draft) {
  const seen = new Set()
  for (const block of draft.body || []) {
    if (block.style !== 'normal') continue
    const normalized = normalizedWords(block.text).join(' ')
    if (normalized.length < 40) continue
    if (seen.has(normalized)) return compact(block.text).slice(0, 100)
    seen.add(normalized)
  }
  return ''
}

function draftQualityIssue(draft, source) {
  const bodyWords = wordCount(draftBodyText(draft))
  const richFormat = ['analysis', 'feature', 'fantasy', 'ranking'].includes(draft.format)
  const minimumWords = richFormat ? RICH_ARTICLE_WORDS_MIN : HEADLINE_WORDS_MIN
  const maximumWords = richFormat ? RICH_ARTICLE_WORDS_MAX : HEADLINE_WORDS_MAX

  if (bodyWords < minimumWords || bodyWords > maximumWords) {
    return `Generated ${draft.format} body is ${bodyWords} words; expected ${minimumWords}-${maximumWords}.`
  }
  if ((draft.sourceFacts || []).length < 4) {
    return 'Generated draft did not provide at least four source-grounded facts.'
  }
  if (draft.summary.length < 90 || draft.summary.length > 240 || !/[.!?]$/.test(draft.summary)) {
    return 'Generated summary must be a complete sentence between 90 and 240 characters.'
  }
  const repeated = repeatedBodyBlock(draft)
  if (repeated) return `Generated draft repeats a paragraph: "${repeated}…"`
  if (GENERIC_SPECULATION_PATTERN.test(`${draft.summary} ${draftBodyText(draft)}`)) {
    return 'Generated draft contains generic or unsupported speculative language.'
  }
  const newNumbers = unsupportedNumbers(draft, source)
  if (newNumbers.length) {
    return `Generated draft introduced number(s) absent from the source: ${newNumbers.join(', ')}.`
  }
  const copied = copiedShingleStats(draft, source)
  if (copied.matches > 2 && copied.ratio > 0.02) {
    return `Generated draft is too textually similar to the source (${copied.matches} matching 12-word passages).`
  }
  if (!compact(draft.editorialValue) || GENERIC_SPECULATION_PATTERN.test(draft.editorialValue)) {
    return 'Generated draft did not identify concrete reader value.'
  }
  return ''
}

function factReviewSchema() {
  const issueArray = {
    type: 'array',
    maxItems: 10,
    items: { type: 'string', minLength: 8, maxLength: 320 },
  }
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'pass',
      'intentSatisfied',
      'originalValueDelivered',
      'unsupportedClaims',
      'entityRelationshipErrors',
      'missingPromisedElements',
      'criticalIssues',
    ],
    properties: {
      pass: { type: 'boolean' },
      intentSatisfied: { type: 'boolean' },
      originalValueDelivered: { type: 'boolean' },
      unsupportedClaims: issueArray,
      entityRelationshipErrors: issueArray,
      missingPromisedElements: issueArray,
      criticalIssues: issueArray,
    },
  }
}

async function verifyDraftAgainstSource(source, draft) {
  const { response, payload } = await fetchOpenAIResponse({
    model: openaiModel,
    reasoning: { effort: 'high' },
    input: [
      {
        role: 'system',
        content: [{
          type: 'input_text',
          text:
            'You are the independent fact and intent gate for an NFL draft. Use only the supplied source packet. Check every name, team-player mapping, number, date, quote, causal statement, and historical statement. Check that the headline promise is fully delivered. Set pass=true only when there are zero unsupported claims, zero entity/relationship errors, zero missing promised elements, and intentSatisfied=true. Assess originalValueDelivered separately: a correct rewrite or summary can pass the factual gate while originalValueDelivered=false. Treat vague filler or a rewritten source summary as no original value, but report that only through originalValueDelivered unless it also causes an intent failure.',
        }],
      },
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text: JSON.stringify({
            source: {
              title: source.title,
              description: source.description,
              url: source.url,
              datePublished: source.datePublished,
              bodyExcerpt: source.bodyExcerpt,
            },
            draft: {
              title: draft.title,
              homepageTitle: draft.homepageTitle,
              summary: draft.summary,
              format: draft.format,
              sourceFacts: draft.sourceFacts,
              editorialValue: draft.editorialValue,
              body: draft.body,
            },
          }),
        }],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'snap_draft_fact_review',
        strict: true,
        schema: factReviewSchema(),
      },
    },
  })

  if (!response.ok) {
    throw new Error(redactSecrets(payload?.error?.message || `OpenAI verification failed with status ${response.status}`))
  }
  const outputText = extractResponseText(payload)
  if (!outputText) throw new Error('OpenAI verification did not include output text.')
  return JSON.parse(outputText)
}

function factReviewIssue(review) {
  if (review?.pass) return ''
  const issues = uniqueStrings([
    ...(review?.entityRelationshipErrors || []),
    ...(review?.unsupportedClaims || []),
    ...(review?.missingPromisedElements || []),
    ...(review?.criticalIssues || []),
  ])
  return issues.length
    ? `Independent fact/intent review failed: ${issues.slice(0, 4).join(' | ')}`
    : 'Independent fact/intent review failed.'
}

function portableBlock(style, text, options = {}) {
  const block = {
    _type: 'block',
    _key: stableKey(text),
    style,
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: stableKey(text),
        text,
        marks: [],
      },
    ],
  }

  if (options.listItem) {
    block.listItem = options.listItem
    block.level = 1
  }

  return block
}

function sourceLinkBlock(source) {
  const markKey = stableKey(source.url)
  return {
    _type: 'block',
    _key: stableKey(source.url),
    style: 'normal',
    markDefs: [
      {
        _key: markKey,
        _type: 'link',
        href: source.url,
      },
    ],
    children: [
      {
        _type: 'span',
        _key: stableKey('source-label'),
        text: 'Source: ',
        marks: [],
      },
      {
        _type: 'span',
        _key: stableKey('source-link'),
        text: `${source.sourceName || sourceNameForUrl(source.url)}${source.author ? ` (${source.author})` : ''}`,
        marks: [markKey],
      },
    ],
  }
}

function buildBody(draft, source) {
  const blocks = draft.body.map((block) =>
    portableBlock(block.style, block.text, { listItem: block.listItem })
  )
  blocks.push(portableBlock('h2', 'Source'))
  blocks.push(sourceLinkBlock(source))
  return blocks
}

async function uniqueSlug(baseSlug, docId) {
  let slug = baseSlug || 'source-headline'
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await client.fetch(
      `*[_type in ["article","headline","rankings"] && slug.current == $slug && !(_id in [$docId, $draftId])][0]{_id}`,
      { slug, docId, draftId: `drafts.${docId}` }
    )
    if (!existing) return slug
    slug = `${baseSlug.slice(0, 84)}-${attempt + 2}`
  }
  return `${baseSlug.slice(0, 80)}-${crypto.randomBytes(3).toString('hex')}`
}

async function findExisting(docId) {
  return client.fetch(
    `*[_type in ["article","headline","rankings"] && _id in [$id, $draftId]][0]{_id,_type,title,"slug":slug.current,published}`,
    { id: docId, draftId: `drafts.${docId}` }
  )
}

const TITLE_DEDUPE_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'for', 'from', 'has', 'have', 'in', 'is',
  'it', 'nfl', 'of', 'on', 'the', 'to', 'with', 'what', 'why', 'how', 'this', 'that',
])

function titleTokens(value) {
  return uniqueStrings(normalizedWords(value))
    .filter((token) => token.length > 2 && !TITLE_DEDUPE_STOP_WORDS.has(token))
}

function titleSimilarity(left, right) {
  const leftTokens = new Set(titleTokens(left))
  const rightTokens = new Set(titleTokens(right))
  if (leftTokens.size < 4 || rightTokens.size < 4) return { score: 0, overlap: 0 }
  let overlap = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1
  }
  const union = new Set([...leftTokens, ...rightTokens]).size
  return { score: union ? overlap / union : 0, overlap }
}

function findSimilarRecentArticle(source, recentArticles) {
  const sourceUrl = normalizeSourceUrl(source.url)
  for (const article of recentArticles || []) {
    if (article.sourceUrl && normalizeSourceUrl(article.sourceUrl) === sourceUrl) return article
    const candidates = [article.title, article.homepageTitle].filter(Boolean)
    for (const title of candidates) {
      const similarity = titleSimilarity(source.title, title)
      if (similarity.overlap >= 5 && similarity.score >= 0.68) return article
    }
  }
  return null
}

function suggestInternalLinks(draft, recentArticles) {
  const draftTokens = new Set(titleTokens([
    draft.title,
    draft.summary,
    ...(draft.sourceFacts || []),
  ].join(' ')))
  return (recentArticles || [])
    .filter((article) => article?.slug && article?.title)
    .map((article) => {
      const articleTokens = new Set(titleTokens(`${article.title} ${article.homepageTitle || ''}`))
      let overlap = 0
      for (const token of articleTokens) {
        if (draftTokens.has(token)) overlap += 1
      }
      return {
        title: article.title,
        slug: article.slug,
        score: articleTokens.size ? overlap / articleTokens.size : 0,
        overlap,
      }
    })
    .filter((article) => article.overlap >= 2 && article.score >= 0.28)
    .sort((left, right) => right.score - left.score || right.overlap - left.overlap)
    .slice(0, draft.format === 'headline' ? 2 : 3)
    .map(({ title, slug }) => ({ title, slug }))
}

function resolvePlayerRefs(playerNames, players) {
  const playerByName = byNormalizedName(players, 'name')
  return uniqueStrings(playerNames)
    .map((name) => playerByName.get(normalizeName(name)))
    .filter(Boolean)
    .map((player) => reference(player._id))
}

async function buildSanityDoc(source, draft, indexes, factReview) {
  const docId = sourceBaseId(source.url)
  const slug = await uniqueSlug(slugify(draft.title), docId)
  const author = bySlug(indexes.authors).get('the-snap') || byNormalizedName(indexes.authors, 'name').get('the snap')
  const category = bySlug(indexes.categories).get(draft.categorySlug) || bySlug(indexes.categories).get('headlines')

  if (!author) throw new Error('Could not find The Snap author in Sanity.')
  if (!category) throw new Error('Could not find a usable category in Sanity.')

  const now = new Date().toISOString()
  const internalLinkSuggestions = suggestInternalLinks(draft, indexes.recentArticles)

  return {
    _id: `drafts.${docId}`,
    _type: 'article',
    format: draft.format,
    title: draft.title,
    homepageTitle: draft.homepageTitle,
    slug: { _type: 'slug', current: slug },
    seo: {
      _type: 'seo',
      autoGenerate: true,
      noIndex: true,
    },
    author: { _type: 'reference', _ref: author._id },
    summary: draft.summary,
    category: { _type: 'reference', _ref: category._id },
    players: resolvePlayerRefs(draft.relatedPlayers, indexes.players),
    teams: existingBySlug(teamDocs(indexes.teams), draft.teamSlugs, 6),
    topicHubs: existingBySlug(indexes.topicHubs, draft.topicHubSlugs, 3),
    tagRefs: existingBySlug(indexes.tagRefs, draft.tagSlugs, 6),
    editorialStatus: 'draft',
    automationImport: {
      _type: 'object',
      sourceUrl: normalizeSourceUrl(source.url),
      sourceTitle: source.title,
      sourceName: source.sourceName || sourceNameForUrl(source.url),
      ...(source.author ? { sourceAuthor: source.author } : {}),
      ...(toIsoDate(source.datePublished) ? { sourcePublishedAt: toIsoDate(source.datePublished) } : {}),
      ingestedAt: now,
      generationModel: openaiModel,
      generationVersion: '2026-07-fact-gated-v1',
      sourceFacts: draft.sourceFacts,
      editorialValue: draft.editorialValue,
      imageIdea: draft.imageIdea,
      internalLinkSuggestions: internalLinkSuggestions.map((suggestion) => ({
        _key: stableKey(suggestion.slug),
        _type: 'object',
        title: suggestion.title,
        slug: suggestion.slug,
      })),
      automatedVerificationPassed: factReview?.pass === true,
      automatedOriginalValueDelivered: factReview?.originalValueDelivered === true,
      automatedVerificationIssues: uniqueStrings([
        ...(factReview?.entityRelationshipErrors || []),
        ...(factReview?.unsupportedClaims || []),
        ...(factReview?.missingPromisedElements || []),
        ...(factReview?.criticalIssues || []),
      ]),
      factChecked: false,
      originalValueReviewed: false,
      taxonomyReviewed: false,
    },
    published: false,
    body: buildBody(draft, source),
  }
}

function printSource(source) {
  if (source.sourceName) console.log(`Source site: ${source.sourceName}`)
  console.log(`Source: ${source.title}`)
  console.log(`URL: ${source.url}`)
  if (source.description) console.log(`Description: ${source.description}`)
  if (source.datePublished) console.log(`Published: ${source.datePublished}`)
  console.log(`Extracted source body chars: ${compact(source.bodyExcerpt).length}`)
}

function printDraft(doc, draft) {
  console.log(`Draft title: ${doc.title}`)
  console.log(`Homepage title: ${doc.homepageTitle}`)
  console.log(`Format: ${doc.format}`)
  console.log(`Slug: ${doc.slug.current}`)
  console.log(`Summary: ${doc.summary}`)
  console.log(`Category ref: ${doc.category?._ref}`)
  console.log(`Teams: ${(doc.teams || []).length}`)
  console.log(`Topic hubs: ${(doc.topicHubs || []).length}`)
  console.log(`Tag refs: ${(doc.tagRefs || []).length}`)
  if (draft.imageIdea) console.log(`Image idea: ${draft.imageIdea}`)
  console.log(`Generated body chars: ${draftBodyText(draft).length}`)
  console.log(`Generated body words: ${wordCount(draftBodyText(draft))}`)
  console.log(`Source-grounded facts: ${(draft.sourceFacts || []).length}`)
  console.log(`Internal link suggestions: ${(doc.automationImport?.internalLinkSuggestions || []).length}`)
  console.log(`Body blocks: ${(doc.body || []).length}`)
}

async function processSource(source, indexes) {
  printSource(source)

  const skipReason = sourceSkipReason(source)
  if (skipReason) {
    console.log(`Skipped source: ${skipReason}.`)
    return { status: 'filtered', source, reason: skipReason }
  }

  const docId = sourceBaseId(source.url)
  const existing = await findExisting(docId)
  if (existing && !FORCE) {
    console.log(`Existing draft/article found: ${existing.title} (${existing._id})`)
    return { status: 'existing', source, existing }
  }

  if (SOURCE_ONLY) {
    console.log('Source-only check complete. Remove --source-only to generate a draft.')
    return { status: 'source-only', source }
  }

  const similarArticle = findSimilarRecentArticle(source, indexes.recentArticles)
  if (similarArticle && !FORCE) {
    console.log(`Potential same-event article found: ${similarArticle.title} (${similarArticle._id}). Skipping duplicate draft.`)
    return { status: 'similar-existing', source, existing: similarArticle }
  }

  const draft = await generateDraft(source, indexes)
  const qualityIssue = draftQualityIssue(draft, source)
  if (qualityIssue) {
    console.log(qualityIssue)
    return { status: 'quality-skip', source, reason: qualityIssue }
  }

  const factReview = RUN_FACT_VERIFICATION
    ? await verifyDraftAgainstSource(source, draft)
    : {
        pass: false,
        intentSatisfied: false,
        originalValueDelivered: false,
        criticalIssues: ['Automated fact verification was explicitly disabled.'],
      }
  if (RUN_FACT_VERIFICATION) {
    const reviewIssue = factReviewIssue(factReview)
    if (reviewIssue) {
      console.log(reviewIssue)
      return { status: 'verification-skip', source, reason: reviewIssue }
    }
  }

  const doc = await buildSanityDoc(source, draft, indexes, factReview)
  printDraft(doc, draft)
  console.log(`Independent fact/intent verification: ${factReview.pass ? 'passed' : 'not run'}`)
  console.log(`Distinct original value already present: ${factReview.originalValueDelivered ? 'yes' : 'no — editor must add it before review'}`)

  if (!WRITE) {
    console.log('Dry run complete. Add --write to create the unpublished Sanity draft.')
    return { status: 'generated', source, doc }
  }

  const created = FORCE ? await client.createOrReplace(doc) : await client.createIfNotExists(doc)
  console.log(`${FORCE ? 'Upserted' : 'Created'} draft: ${created._id}`)
  return { status: FORCE ? 'upserted' : 'created', source, doc: created }
}

async function runDailyBatch() {
  console.log(`Running daily source batch (${WRITE ? 'write' : 'dry-run'} mode)...`)
  console.log(`Sanity target: project ${projectId}, dataset ${dataset}, document type article drafts.`)
  console.log(`Targets: up to ${DAILY_NFL_LIMIT} NFL.com and ${DAILY_OTHER_LIMIT} from a secondary source; ${DAILY_TOTAL_LIMIT} total per UTC day.`)

  const indexes = SOURCE_ONLY ? null : await fetchSanityIndexes()
  const secondarySites = Math.floor(Date.now() / 86_400_000) % 2 === 0
    ? ['sharp', 'pfn']
    : ['pfn', 'sharp']
  const targets = [
    { site: 'nfl', quota: DAILY_NFL_LIMIT },
    ...secondarySites.map((site) => ({ site, quota: DAILY_OTHER_LIMIT })),
  ]
  const summary = []
  const importedToday = SOURCE_ONLY ? [] : indexes.importsToday || []
  let totalAccepted = SOURCE_ONLY ? 0 : importedToday.length

  for (const target of targets) {
    const config = SOURCE_CONFIGS[target.site]
    const alreadyImported = importedToday.filter((item) => item.sourceName === config.displayName).length
    const remainingDailyTotal = Math.max(0, DAILY_TOTAL_LIMIT - totalAccepted)
    const effectiveQuota = SOURCE_ONLY
      ? target.quota
      : Math.min(Math.max(0, target.quota - alreadyImported), remainingDailyTotal)
    if (effectiveQuota === 0) {
      summary.push({
        site: config.displayName,
        accepted: 0,
        quota: target.quota,
        counts: { 'daily-quota-reached': 1 },
      })
      continue
    }

    console.log(`\nScanning ${config.displayName}...`)
    let sources
    try {
      sources = await fetchCandidateSources(target.site, CANDIDATE_LIMIT)
    } catch (error) {
      console.log(`Source feed failed without aborting the remaining sites: ${redactSecrets(error?.message || error)}`)
      summary.push({ site: config.displayName, accepted: 0, quota: effectiveQuota, counts: { error: 1 } })
      continue
    }
    let accepted = 0
    const counts = {}

    for (const source of sources) {
      if (accepted >= effectiveQuota || totalAccepted >= DAILY_TOTAL_LIMIT) break
      console.log('')
      try {
        const result = await processSource(source, indexes)
        counts[result.status] = (counts[result.status] || 0) + 1
        if (['created', 'upserted', 'generated', 'source-only'].includes(result.status)) {
          accepted += 1
          totalAccepted += 1
        }
      } catch (error) {
        counts.error = (counts.error || 0) + 1
        console.log(`Source failed without aborting the batch: ${redactSecrets(error?.message || error)}`)
      }
    }

    summary.push({ site: config.displayName, accepted, quota: effectiveQuota, counts })
  }

  console.log('\nDaily batch summary:')
  for (const item of summary) {
    const countText = Object.entries(item.counts)
      .map(([status, count]) => `${status}:${count}`)
      .join(', ') || 'none'
    console.log(`- ${item.site}: ${item.accepted}/${item.quota} accepted (${countText})`)
  }
}

async function main() {
  if (DAILY_BATCH) {
    await runDailyBatch()
    return
  }

  const config = SOURCE_CONFIGS[siteArg]
  const sourceLabel = sourceUrlArg ? sourceNameForUrl(sourceUrlArg) : config?.displayName || siteArg
  console.log(`Checking ${sourceLabel} source (${WRITE ? 'write' : 'dry-run'} mode)...`)
  console.log(`Sanity target: project ${projectId}, dataset ${dataset}, document type article drafts.`)

  const source = await fetchNewestSource()
  const indexes = SOURCE_ONLY ? null : await fetchSanityIndexes()
  await processSource(source, indexes)
}

main().catch((error) => {
  console.error(redactSecrets(error?.stack || error?.message || error))
  process.exit(1)
})

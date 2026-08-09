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
import dns from 'node:dns/promises'
import https from 'node:https'
import net from 'node:net'
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
const RUN_SUPPORTING_RESEARCH =
  !args.includes('--skip-supporting-research') &&
  process.env.NFL_IMPORT_SUPPORTING_RESEARCH !== 'false'
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
const HEADLINE_WORDS_MIN = Number.parseInt(process.env.NFL_IMPORT_HEADLINE_WORDS_MIN || '260', 10)
const HEADLINE_WORDS_MAX = Number.parseInt(process.env.NFL_IMPORT_HEADLINE_WORDS_MAX || '750', 10)
const RICH_ARTICLE_WORDS_MIN = Number.parseInt(process.env.NFL_IMPORT_RICH_WORDS_MIN || '700', 10)
const RICH_ARTICLE_WORDS_MAX = Number.parseInt(process.env.NFL_IMPORT_RICH_WORDS_MAX || '1600', 10)
const MIN_SOURCE_FACTS = Number.parseInt(process.env.NFL_IMPORT_MIN_SOURCE_FACTS || '5', 10)
const MIN_SUPPORTING_FACTS = Number.parseInt(process.env.NFL_IMPORT_MIN_SUPPORTING_FACTS || '1', 10)
const MIN_INFORMATION_GAINS = Number.parseInt(process.env.NFL_IMPORT_MIN_INFORMATION_GAINS || '2', 10)
const DAILY_NFL_LIMIT = Number.parseInt(valueArg('--nfl-limit') || process.env.NFL_IMPORT_DAILY_NFL_LIMIT || '1', 10)
const DAILY_OTHER_LIMIT = Number.parseInt(valueArg('--other-limit') || process.env.NFL_IMPORT_DAILY_OTHER_LIMIT || '1', 10)
const DAILY_TOTAL_LIMIT = Number.parseInt(valueArg('--total-limit') || process.env.NFL_IMPORT_DAILY_TOTAL_LIMIT || '2', 10)
const CANDIDATE_LIMIT = Number.parseInt(valueArg('--candidate-limit') || process.env.NFL_IMPORT_CANDIDATE_LIMIT || '12', 10)
const OPENAI_MAX_RETRIES = Number.parseInt(process.env.NFL_IMPORT_OPENAI_MAX_RETRIES || '2', 10)
const MAX_DRAFT_REVISIONS = boundedInteger(process.env.NFL_IMPORT_MAX_DRAFT_REVISIONS, 1, 0, 1)
const MAX_RESEARCH_CANDIDATES = boundedInteger(process.env.NFL_IMPORT_MAX_RESEARCH_CANDIDATES, 4, 1, 8)
const MAX_OPENAI_CALLS_PER_RUN = boundedInteger(process.env.NFL_IMPORT_MAX_OPENAI_CALLS_PER_RUN, 14, 4, 30)
const MAX_OPENAI_REQUESTS_PER_RUN = boundedInteger(process.env.NFL_IMPORT_MAX_OPENAI_REQUESTS_PER_RUN, 18, 4, 40)
const MAX_SUPPORTING_SOURCE_URLS = boundedInteger(process.env.NFL_IMPORT_MAX_SUPPORTING_SOURCE_URLS, 6, 1, 8)
const MAX_SUPPORTING_SOURCE_CHARS = boundedInteger(process.env.NFL_IMPORT_MAX_SUPPORTING_SOURCE_CHARS, 8000, 2000, 12000)
const MAX_SUPPORTING_RESPONSE_BYTES = boundedInteger(process.env.NFL_IMPORT_MAX_SUPPORTING_RESPONSE_BYTES, 1_500_000, 100_000, 3_000_000)
const OPENAI_RETRY_BASE_MS = Number.parseInt(process.env.NFL_IMPORT_OPENAI_RETRY_BASE_MS || '1500', 10)
const OPENAI_TIMEOUT_MS = Number.parseInt(process.env.NFL_IMPORT_OPENAI_TIMEOUT_MS || '120000', 10)
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

const TRUSTED_RESEARCH_DOMAINS = new Set([
  'nfl.com',
  'nflpa.com',
  'profootballhof.com',
  'pro-football-reference.com',
  'sports-reference.com',
  'stathead.com',
  'espn.com',
  'cbssports.com',
  'foxsports.com',
  'nbcsports.com',
  'yahoo.com',
  'apnews.com',
  'reuters.com',
  'si.com',
  'usatoday.com',
  'nytimes.com',
  'spotrac.com',
  'overthecap.com',
  'pff.com',
  'statmuse.com',
  'teamrankings.com',
  'fantasypros.com',
  'rotowire.com',
  'footballguys.com',
  '4for4.com',
  'ftnfantasy.com',
  'sharpfootballanalysis.com',
  'profootballnetwork.com',
  'azcardinals.com',
  'atlantafalcons.com',
  'baltimoreravens.com',
  'buffalobills.com',
  'panthers.com',
  'chicagobears.com',
  'bengals.com',
  'clevelandbrowns.com',
  'dallascowboys.com',
  'denverbroncos.com',
  'detroitlions.com',
  'packers.com',
  'houstontexans.com',
  'colts.com',
  'jaguars.com',
  'chiefs.com',
  'raiders.com',
  'chargers.com',
  'therams.com',
  'miamidolphins.com',
  'vikings.com',
  'patriots.com',
  'neworleanssaints.com',
  'giants.com',
  'newyorkjets.com',
  'philadelphiaeagles.com',
  'steelers.com',
  '49ers.com',
  'seahawks.com',
  'buccaneers.com',
  'titansonline.com',
  'commanders.com',
])

const MAX_SOURCE_BODY_CHARS = Number.parseInt(process.env.NFL_IMPORT_MAX_SOURCE_BODY_CHARS || '12000', 10)
let openaiCallCount = 0
let openaiRequestCount = 0
let researchCandidateCount = 0
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
const THIN_REACTION_PATTERN =
  /\b(fans? react|social media reacts?|draws? (questions?|backlash|reactions?)|viral (clip|video)|takes? aim|claps? back|sounds? off|calls? out)\b/i
const YOUTH_FOOTBALL_PATTERN =
  /\b(nfl flag|flag football|youth football|girls'? flag|boys'? flag|high school|middle school|u-?\d{1,2}|under-\d{1,2})\b/i
const SENSITIVE_STORY_PATTERN =
  /\b(dies?|dead|death|obituary|passes away|arrests?|arrested|charges?|charged|criminal|lawsuits?|legal issues?|legal matters?|legal proceedings?|court|felony|felonies|dui|dwi|suspend(?:ed|ing|s)?|suspension|discipline|disciplinary|appeals?|appealed|investigation|investigated|indictment|indicted|allegations?|sexual assault|domestic violence|ownership succession)\b/i
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

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(maximum, Math.max(minimum, parsed))
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
  if (openaiCallCount >= MAX_OPENAI_CALLS_PER_RUN) {
    const error = new Error(`OpenAI run budget reached (${MAX_OPENAI_CALLS_PER_RUN} response calls).`)
    error.code = 'OPENAI_RUN_BUDGET'
    throw error
  }
  openaiCallCount += 1

  const attempts = Math.max(1, OPENAI_MAX_RETRIES + 1)
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (openaiRequestCount >= MAX_OPENAI_REQUESTS_PER_RUN) {
      const error = new Error(`OpenAI HTTP request budget reached (${MAX_OPENAI_REQUESTS_PER_RUN} requests).`)
      error.code = 'OPENAI_RUN_BUDGET'
      throw error
    }
    openaiRequestCount += 1
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

      if (!response.ok && response.status >= 400 && response.status < 500 && !retryableOpenAIStatus(response.status)) {
        const error = new Error(redactSecrets(payload?.error?.message || `OpenAI request failed with status ${response.status}`))
        error.code = 'OPENAI_FATAL_REQUEST'
        throw error
      }

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
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`Unsupported source URL protocol: ${parsed.protocol}`)
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    /^(?:0|10|127)\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^(?:::1|f[cd][0-9a-f:]*|fe8[0-9a-f:]*)$/i.test(hostname)
  ) throw new Error(`Unsafe source URL host: ${hostname}`)
  parsed.hash = ''
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|ref$|source$)/i.test(key)) parsed.searchParams.delete(key)
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/'
  return parsed.toString()
}

function safeNormalizeSourceUrl(url) {
  try {
    return normalizeSourceUrl(url)
  } catch {
    return ''
  }
}

function publisherDomainForUrl(url) {
  const normalized = safeNormalizeSourceUrl(url)
  if (!normalized) return ''
  const parts = new URL(normalized).hostname.replace(/^www\./i, '').toLowerCase().split('.').filter(Boolean)
  if (parts.length < 2) return parts.join('.')
  const suffix = parts.slice(-2).join('.')
  if (['co.uk', 'com.au', 'com.br', 'com.mx', 'co.nz'].includes(suffix) && parts.length >= 3) {
    return parts.slice(-3).join('.')
  }
  return suffix
}

function trustedResearchUrl(url) {
  const normalized = safeNormalizeSourceUrl(url)
  if (!normalized) return false
  const parsed = new URL(normalized)
  if (parsed.protocol !== 'https:' || (parsed.port && parsed.port !== '443')) return false
  return TRUSTED_RESEARCH_DOMAINS.has(publisherDomainForUrl(normalized))
}

function publicIpv4(address) {
  if (net.isIP(address) !== 4) return false
  const [a, b, c] = address.split('.').map(Number)
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && [0, 168].includes(b)) return false
  if (a === 198 && [18, 19].includes(b)) return false
  if (a === 198 && b === 51 && c === 100) return false
  if (a === 203 && b === 0 && c === 113) return false
  return true
}

async function pinnedPublicIpv4(hostname) {
  const addresses = await dns.lookup(hostname, { all: true, family: 4, verbatim: true })
  if (!addresses.length || addresses.some((item) => !publicIpv4(item.address))) {
    throw new Error(`Supporting source did not resolve exclusively to public IPv4 addresses: ${hostname}`)
  }
  return addresses[0]
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

async function fetchTrustedSupportingText(url, redirectCount = 0) {
  const normalized = safeNormalizeSourceUrl(url)
  if (!normalized || !trustedResearchUrl(normalized)) {
    throw new Error(`Supporting source is not on the HTTPS trusted-publisher allowlist: ${url}`)
  }
  if (redirectCount > 3) throw new Error(`Too many redirects for supporting source: ${normalized}`)

  const parsed = new URL(normalized)
  const pinnedAddress = await pinnedPublicIpv4(parsed.hostname)

  return new Promise((resolve, reject) => {
    let settled = false
    let wallClockTimeout
    const finish = (error, value) => {
      if (settled) return
      settled = true
      clearTimeout(wallClockTimeout)
      if (error) reject(error)
      else resolve(value)
    }

    const request = https.request({
      protocol: 'https:',
      hostname: parsed.hostname,
      port: 443,
      path: `${parsed.pathname}${parsed.search}`,
      method: 'GET',
      servername: parsed.hostname,
      family: 4,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json;q=0.8,text/plain;q=0.7',
        'accept-encoding': 'identity',
        'user-agent': 'TheSnapHeadlineImporter/1.0 (+https://thegamesnap.com)',
      },
      lookup: (_hostname, options, callback) => {
        if (options?.all) callback(null, [pinnedAddress])
        else callback(null, pinnedAddress.address, pinnedAddress.family)
      },
    }, (response) => {
      const status = response.statusCode || 0
      if (status >= 300 && status < 400) {
        const location = response.headers.location
        response.destroy()
        if (!location) {
          finish(new Error(`Supporting source redirect omitted Location: ${normalized}`))
          return
        }
        let nextUrl
        try {
          nextUrl = new URL(location, normalized).toString()
        } catch {
          finish(new Error(`Supporting source returned an invalid redirect: ${normalized}`))
          return
        }
        fetchTrustedSupportingText(nextUrl, redirectCount + 1).then(
          (value) => finish(null, value),
          (error) => finish(error)
        )
        return
      }

      if (status < 200 || status >= 300) {
        response.destroy()
        finish(new Error(`Supporting source request failed ${status}: ${normalized}`))
        return
      }

      const contentType = compact(response.headers['content-type']).toLowerCase()
      if (!/^(text\/html|application\/xhtml\+xml|text\/plain|application\/(?:ld\+)?json)(?:;|$)/i.test(contentType)) {
        response.destroy()
        finish(new Error(`Supporting source returned unsupported content type "${contentType || 'missing'}": ${normalized}`))
        return
      }

      const declaredBytes = Number.parseInt(response.headers['content-length'] || '0', 10)
      if (Number.isFinite(declaredBytes) && declaredBytes > MAX_SUPPORTING_RESPONSE_BYTES) {
        response.destroy()
        finish(new Error(`Supporting source exceeded ${MAX_SUPPORTING_RESPONSE_BYTES} bytes: ${normalized}`))
        return
      }

      const chunks = []
      let receivedBytes = 0
      response.on('data', (chunk) => {
        if (settled) return
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        receivedBytes += buffer.length
        if (receivedBytes > MAX_SUPPORTING_RESPONSE_BYTES) {
          response.destroy()
          finish(new Error(`Supporting source exceeded ${MAX_SUPPORTING_RESPONSE_BYTES} bytes while streaming: ${normalized}`))
          return
        }
        chunks.push(buffer)
      })
      response.on('end', () => finish(null, Buffer.concat(chunks).toString('utf8')))
      response.on('aborted', () => finish(new Error(`Supporting source response was aborted: ${normalized}`)))
      response.on('error', (error) => finish(error))
    })

    request.setTimeout(20_000, () => {
      request.destroy(new Error(`Supporting source timed out: ${normalized}`))
    })
    wallClockTimeout = setTimeout(() => {
      request.destroy(new Error(`Supporting source exceeded the 25-second wall-clock deadline: ${normalized}`))
    }, 25_000)
    request.on('error', (error) => finish(error))
    request.end()
  })
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

  const genericAnchorRegex = /<a\b[^>]*\bhref=(["'])([^"']*\/news\/[^"']+)\1[^>]*>([\s\S]*?)<\/a>/gi
  while ((match = genericAnchorRegex.exec(html))) {
    const tag = match[0].slice(0, match[0].indexOf('>') + 1)
    const href = compact(match[2])
    if (!href || href.includes('/news/series/') || /\/news\/(all-news)?\/?(?:[?#]|$)/i.test(href)) continue

    let parsedUrl
    try {
      parsedUrl = new URL(href, 'https://www.nfl.com')
    } catch {
      continue
    }
    if (!/(^|\.)nfl\.com$/i.test(parsedUrl.hostname)) continue
    parsedUrl.protocol = 'https:'
    parsedUrl.hostname = 'www.nfl.com'
    parsedUrl.search = ''
    parsedUrl.hash = ''

    const slugTitle = parsedUrl.pathname
      .split('/')
      .filter(Boolean)
      .at(-1)
      ?.replace(/-/g, ' ')
    const title = compact(
      htmlAttr(tag, 'data-link_name') ||
      htmlAttr(tag, 'title') ||
      htmlAttr(tag, 'aria-label') ||
      stripHtml(match[3]) ||
      slugTitle
    )
    if (!title) continue

    cards.push({
      title,
      url: parsedUrl.toString(),
      order: cards.length + 1,
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
  if (THIN_REACTION_PATTERN.test(text)) return 'reaction-driven source without durable reader utility'
  if (YOUTH_FOOTBALL_PATTERN.test(text)) return 'youth/flag story requires a separate editorial workflow'
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

function sourcePotentialScore(source) {
  const text = `${source.title || ''} ${source.description || ''} ${source.articleSection || ''} ${source.bodyExcerpt || ''}`
  const numbers = text.match(/\b\d[\d,.%$-]*\b/g) || []
  let score = Math.min(12, numbers.length) * 2
  score += Math.min(6, Math.floor(compact(source.bodyExcerpt).length / 1200))
  if (/\b(stats?|metrics?|usage|snaps?|routes?|targets?|yards?|touchdowns?|efficiency|projection|schedule|contract|salary cap|fantasy|odds|analysis|comparison)\b/i.test(text)) score += 8
  if (/\b(official|announced|signed|released|traded|activated|placed on|injury report|depth chart)\b/i.test(text)) score += 4
  if (source.sourceName === 'NFL.com') score += 2
  if (THIN_REACTION_PATTERN.test(text) || LOW_VALUE_STORY_PATTERN.test(text)) score -= 20
  return score
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
      published == true &&
      (!defined(seo.noIndex) || seo.noIndex == false) &&
      defined(slug.current)
    ] | order(coalesce(date, _updatedAt, _createdAt) desc)[0...500]{
      _id,
      title,
      homepageTitle,
      "slug": slug.current,
      "sourceUrl": automationImport.sourceUrl
    },
    "dedupeArticles": *[
      _type == "article" &&
      _updatedAt >= $dedupeStart
    ] | order(_updatedAt desc)[0...500]{
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
  }`, {
    dayStart: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    dedupeStart: new Date(Date.now() - 45 * 86_400_000).toISOString(),
  })
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
    ...(options.includeBody === true ? [source.bodyExcerpt] : []),
  ].join(' ')
  if (YOUTH_FOOTBALL_PATTERN.test(rawText)) return []
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

function supportingResearchSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'usable',
      'readerQuestion',
      'researchSummary',
      'supportingFacts',
      'informationGain',
      'evidenceArtifact',
      'limitations',
    ],
    properties: {
      usable: { type: 'boolean' },
      readerQuestion: { type: 'string', minLength: 20, maxLength: 220 },
      researchSummary: { type: 'string', minLength: 40, maxLength: 500 },
      supportingFacts: {
        type: 'array',
        minItems: 0,
        maxItems: 12,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['claim', 'sourceTitle', 'sourceUrl', 'sourceDate', 'metricContext'],
          properties: {
            claim: { type: 'string', minLength: 20, maxLength: 360 },
            sourceTitle: { type: 'string', minLength: 3, maxLength: 220 },
            sourceUrl: { type: 'string', minLength: 12, maxLength: 500 },
            sourceDate: { type: ['string', 'null'], maxLength: 40 },
            metricContext: { type: ['string', 'null'], maxLength: 240 },
          },
        },
      },
      informationGain: {
        type: 'array',
        minItems: 0,
        maxItems: 4,
        items: { type: 'string', minLength: 20, maxLength: 280 },
      },
      evidenceArtifact: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'title', 'caption', 'columns', 'rows'],
        properties: {
          type: {
            type: 'string',
            enum: ['statComparison', 'timeline', 'calculation', 'decisionFramework', 'none'],
          },
          title: { type: 'string', maxLength: 140 },
          caption: { type: 'string', maxLength: 160 },
          columns: {
            type: 'array',
            minItems: 0,
            maxItems: 6,
            items: { type: 'string', minLength: 1, maxLength: 80 },
          },
          rows: {
            type: 'array',
            minItems: 0,
            maxItems: 12,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['cells'],
              properties: {
                cells: {
                  type: 'array',
                  minItems: 0,
                  maxItems: 6,
                  items: { type: 'string', maxLength: 180 },
                },
              },
            },
          },
        },
      },
      limitations: {
        type: 'array',
        minItems: 0,
        maxItems: 4,
        items: { type: 'string', minLength: 15, maxLength: 260 },
      },
    },
  }
}

function extractWebResearchSources(payload) {
  const sources = []

  for (const item of payload?.output || []) {
    if (item?.type === 'web_search_call') {
      for (const source of item.action?.sources || []) {
        if (!source?.url) continue
        sources.push({
          url: safeNormalizeSourceUrl(source.url),
          title: compact(source.title || source.url),
        })
      }
    }

    if (item?.type === 'message') {
      for (const content of item.content || []) {
        for (const annotation of content.annotations || []) {
          if (annotation?.type !== 'url_citation' || !annotation.url) continue
          sources.push({
            url: safeNormalizeSourceUrl(annotation.url),
            title: compact(annotation.title || annotation.url),
          })
        }
      }
    }
  }

  const deduped = new Map()
  for (const source of sources) {
    if (source.url && !deduped.has(source.url)) deduped.set(source.url, source)
  }
  return Array.from(deduped.values())
}

function sourceHostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

function cleanEvidenceArtifact(value) {
  const type = ['statComparison', 'timeline', 'calculation', 'decisionFramework'].includes(value?.type)
    ? value.type
    : 'none'
  const columns = uniqueStrings(value?.columns || []).slice(0, 6)
  const rows = (value?.rows || [])
    .map((row) => ({ cells: (row?.cells || []).map(compact).slice(0, columns.length || 6) }))
    .filter((row) => row.cells.some(Boolean))
    .slice(0, 12)

  return {
    type,
    title: compact(value?.title),
    caption: compact(value?.caption),
    columns,
    rows,
  }
}

function normalizeSupportingResearch(research, payload, source) {
  const retrievedSources = extractWebResearchSources(payload)
  const retrievedUrls = new Set([
    ...retrievedSources.map((item) => item.url),
    safeNormalizeSourceUrl(source.url),
  ])
  let invalidFactUrlCount = 0
  const supportingFacts = (research?.supportingFacts || [])
    .map((fact) => {
      const sourceUrl = safeNormalizeSourceUrl(fact?.sourceUrl)
      if (compact(fact?.sourceUrl) && !sourceUrl) invalidFactUrlCount += 1
      return {
        claim: compact(fact?.claim),
        sourceTitle: compact(fact?.sourceTitle),
        sourceUrl,
        sourceDate: compact(fact?.sourceDate),
        metricContext: compact(fact?.metricContext),
      }
    })
    .filter((fact) => fact.claim && fact.sourceUrl)
    .slice(0, 12)

  return {
    usable: research?.usable === true,
    readerQuestion: compact(research?.readerQuestion),
    researchSummary: compact(research?.researchSummary),
    supportingFacts,
    informationGain: uniqueStrings(research?.informationGain || []).slice(0, 4),
    evidenceArtifact: cleanEvidenceArtifact(research?.evidenceArtifact),
    limitations: uniqueStrings(research?.limitations || []).slice(0, 4),
    retrievedSources,
    invalidFactUrlCount,
    uncitedFactUrls: uniqueStrings(
      supportingFacts
        .map((fact) => fact.sourceUrl)
        .filter((url) => !retrievedUrls.has(url))
    ),
  }
}

function supportingResearchIssue(research, source) {
  if (!research?.usable) return 'Supporting research found no defensible original-value angle.'
  if (research.invalidFactUrlCount) return 'Supporting research returned a malformed or unsupported source URL.'
  const untrustedFact = (research.supportingFacts || []).find((fact) => !trustedResearchUrl(fact.sourceUrl))
  if (untrustedFact) {
    return `Supporting research cited a source outside the HTTPS trusted-publisher allowlist: ${untrustedFact.sourceUrl}`
  }
  const sourceDomain = publisherDomainForUrl(source.url)
  const externalFacts = (research.supportingFacts || [])
    .filter((fact) => publisherDomainForUrl(fact.sourceUrl) !== sourceDomain)
  if (externalFacts.length < MIN_SUPPORTING_FACTS) {
    return `Supporting research provided fewer than ${MIN_SUPPORTING_FACTS} independently sourced claim-level facts.`
  }
  if ((research.informationGain || []).length < MIN_INFORMATION_GAINS) {
    return `Supporting research provided fewer than ${MIN_INFORMATION_GAINS} concrete information-gain additions.`
  }
  if ((research.uncitedFactUrls || []).length) {
    return `Supporting research used URL(s) absent from the web-search evidence: ${research.uncitedFactUrls.slice(0, 3).join(', ')}.`
  }

  const supportingDomains = new Set(
    externalFacts
      .map((fact) => publisherDomainForUrl(fact.sourceUrl))
      .filter(Boolean)
  )
  if (!supportingDomains.size) {
    return 'Supporting research did not add an independent source beyond the original publisher.'
  }
  const supportingUrls = new Set((research.supportingFacts || []).map((fact) => fact.sourceUrl).filter(Boolean))
  if (supportingUrls.size > MAX_SUPPORTING_SOURCE_URLS) {
    return `Supporting research used ${supportingUrls.size} source URLs; the verification limit is ${MAX_SUPPORTING_SOURCE_URLS}.`
  }

  const artifact = research.evidenceArtifact || {}
  if (artifact.type === 'none') return 'Supporting research did not produce a concrete evidence artifact.'
  if ((artifact.columns || []).length < 2 || (artifact.rows || []).length < 2) {
    return 'Supporting research evidence artifact needs at least two columns and two complete rows.'
  }
  if (artifact.rows.some((row) => row.cells.length !== artifact.columns.length || row.cells.some((cell) => !cell))) {
    return 'Supporting research evidence artifact contains incomplete rows.'
  }
  return ''
}

async function researchSource(source) {
  const { response, payload } = await fetchOpenAIResponse({
    model: openaiModel,
    reasoning: { effort: 'high' },
    tools: [{ type: 'web_search', search_context_size: 'medium' }],
    tool_choice: 'auto',
    include: ['web_search_call.action.sources'],
    input: [
      {
        role: 'system',
        content: [{
          type: 'input_text',
          text:
            'You are the research editor for THE SNAP, a small NFL publication. Decide whether a source story can become a people-first article with concrete utility beyond a rewrite. Search the current web. Prioritize official NFL and team sources, league data, Pro Football Reference, established statistics providers, contract/cap sources, and direct reporting. Every supporting fact must include its exact source URL. For a statistic, metricContext must state the season or date range, denominator or sample when applicable, and what the number measures. Do not use social reactions, search snippets, unsourced claims, rumors, or invented context. Mark usable=true only when the research supports at least two specific additions and a compact table, timeline, calculation, or decision framework. A longer summary is not original value. If the story is gossip, outrage, thin reaction, unsupported injury speculation, or cannot support an evidence artifact, mark usable=false.',
        }],
      },
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text:
            'Research this candidate and return only JSON matching the schema. The evidence artifact must be self-contained, use only cited facts, and contain at least two complete rows when usable=true. Keep limitations honest.\n\n' +
            JSON.stringify({
              currentDate: new Date().toISOString(),
              source: {
                title: source.title,
                description: source.description,
                url: source.url,
                datePublished: source.datePublished,
                author: source.author,
                articleSection: source.articleSection,
                bodyExcerpt: source.bodyExcerpt,
              },
            }),
        }],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'snap_supporting_research',
        strict: true,
        schema: supportingResearchSchema(),
      },
    },
  })

  if (!response.ok) {
    throw new Error(redactSecrets(payload?.error?.message || `OpenAI supporting research failed with status ${response.status}`))
  }
  const outputText = extractResponseText(payload)
  if (!outputText) throw new Error('OpenAI supporting research did not include output text.')
  return normalizeSupportingResearch(JSON.parse(outputText), payload, source)
}

function supportingResearchVerificationSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['pass', 'claimChecks', 'evidenceArtifactSupported', 'issues'],
    properties: {
      pass: { type: 'boolean' },
      claimChecks: {
        type: 'array',
        minItems: 0,
        maxItems: 12,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['claimIndex', 'supported', 'evidenceText', 'issue'],
          properties: {
            claimIndex: { type: 'integer', minimum: 0, maximum: 11 },
            supported: { type: 'boolean' },
            evidenceText: { type: 'string', maxLength: 400 },
            issue: { type: 'string', maxLength: 320 },
          },
        },
      },
      evidenceArtifactSupported: { type: 'boolean' },
      issues: {
        type: 'array',
        maxItems: 12,
        items: { type: 'string', minLength: 8, maxLength: 320 },
      },
    },
  }
}

function supportingSourceExcerpt(html) {
  const jsonLd = parseJsonLd(html) || {}
  const articleMatch = String(html || '').match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
  return compact(
    jsonLd.articleBody ||
    stripHtml(articleMatch?.[1] || html)
  ).slice(0, MAX_SUPPORTING_SOURCE_CHARS)
}

async function fetchSupportingSourcePackets(source, research) {
  const originalUrl = safeNormalizeSourceUrl(source.url)
  const factByUrl = new Map()
  if (originalUrl) {
    factByUrl.set(originalUrl, { sourceTitle: source.title })
  }
  for (const fact of research.supportingFacts || []) {
    if (!fact.sourceUrl || factByUrl.has(fact.sourceUrl)) continue
    factByUrl.set(fact.sourceUrl, fact)
  }

  return Promise.all([...factByUrl].map(async ([url, fact]) => {
    if (url === originalUrl) {
      return {
        url,
        title: compact(source.title || fact.sourceTitle),
        excerpt: compact(source.bodyExcerpt).slice(0, MAX_SUPPORTING_SOURCE_CHARS),
        fetchError: '',
      }
    }

    try {
      const html = await fetchTrustedSupportingText(url)
      const excerpt = supportingSourceExcerpt(html)
      return {
        url,
        title: compact(fact.sourceTitle),
        excerpt,
        fetchError: excerpt.length >= 120 ? '' : 'Fetched source did not expose enough readable article text.',
      }
    } catch (error) {
      return {
        url,
        title: compact(fact.sourceTitle),
        excerpt: '',
        fetchError: redactSecrets(error?.message || error),
      }
    }
  }))
}

async function verifySupportingResearch(source, research) {
  const sourcePackets = await fetchSupportingSourcePackets(source, research)
  const unavailable = sourcePackets.filter((packet) => packet.fetchError || packet.excerpt.length < 120)
  if (unavailable.length) {
    return {
      pass: false,
      claimChecks: [],
      evidenceArtifactSupported: false,
      issues: unavailable.map((packet) => `Could not verify source text for ${packet.url}: ${packet.fetchError || 'insufficient text'}`),
      sourcePackets,
    }
  }

  const { response, payload } = await fetchOpenAIResponse({
    model: openaiModel,
    reasoning: { effort: 'high' },
    input: [
      {
        role: 'system',
        content: [{
          type: 'input_text',
          text:
            'You are the independent source-grounding gate for NFL research. Use only the supplied source excerpts, never the URL or page title alone, and verify each claim only against the packet whose URL exactly matches that claim sourceUrl. Return exactly one claimCheck for every numbered claim. Set supported=true only when that cited source excerpt directly supports the entire claim, including every name, date, number, comparison, and metric context. evidenceText must quote or tightly reproduce the shortest supporting passage from the matching excerpt. Set evidenceArtifactSupported=true only when every cell and relationship in the proposed artifact follows from supported claims or the supplied excerpts. If a source excerpt is ambiguous, partial, or discusses a different season/sample, fail it.',
        }],
      },
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text: JSON.stringify({
            sourcePackets: sourcePackets.map(({ url, title, excerpt }) => ({ url, title, excerpt })),
            claims: (research.supportingFacts || []).map((fact, claimIndex) => ({
              claimIndex,
              claim: fact.claim,
              sourceUrl: fact.sourceUrl,
              metricContext: fact.metricContext,
            })),
            evidenceArtifact: research.evidenceArtifact,
          }),
        }],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'snap_supporting_research_verification',
        strict: true,
        schema: supportingResearchVerificationSchema(),
      },
    },
  })

  if (!response.ok) {
    throw new Error(redactSecrets(payload?.error?.message || `OpenAI research verification failed with status ${response.status}`))
  }
  const outputText = extractResponseText(payload)
  if (!outputText) throw new Error('OpenAI research verification did not include output text.')
  return { ...JSON.parse(outputText), sourcePackets }
}

function supportingResearchVerificationIssue(review, research) {
  const expectedCount = (research.supportingFacts || []).length
  const checks = Array.isArray(review?.claimChecks) ? review.claimChecks : []
  const byIndex = new Map()
  for (const check of checks) {
    if (!Number.isInteger(check?.claimIndex) || byIndex.has(check.claimIndex)) continue
    byIndex.set(check.claimIndex, check)
  }

  const issues = uniqueStrings(review?.issues || [])
  if (checks.length !== expectedCount || byIndex.size !== expectedCount) {
    issues.unshift(`Research verifier returned ${byIndex.size}/${expectedCount} unique claim checks`)
  }
  for (let index = 0; index < expectedCount; index += 1) {
    const check = byIndex.get(index)
    if (!check || check.supported !== true || compact(check.evidenceText).length < 8) {
      issues.push(check?.issue || `Supporting research claim ${index + 1} was not directly grounded in its source text`)
    }
  }
  if (review?.evidenceArtifactSupported !== true) {
    issues.unshift('The proposed evidence artifact is not fully grounded in the fetched source text')
  }
  if (review?.pass !== true) issues.unshift('Independent source-grounding review did not pass')

  return issues.length
    ? `Supporting research verification failed: ${uniqueStrings(issues).slice(0, 4).join(' | ')}`
    : ''
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
      'readerQuestion',
      'informationGain',
      'keyTakeaways',
      'limitations',
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
        minItems: MIN_SOURCE_FACTS,
        maxItems: 12,
        items: { type: 'string', minLength: 12, maxLength: 260 },
      },
      readerQuestion: { type: 'string', minLength: 20, maxLength: 220 },
      informationGain: {
        type: 'array',
        minItems: MIN_INFORMATION_GAINS,
        maxItems: 4,
        items: { type: 'string', minLength: 20, maxLength: 280 },
      },
      keyTakeaways: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: { type: 'string', minLength: 15, maxLength: 240 },
      },
      limitations: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: { type: 'string', minLength: 15, maxLength: 260 },
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

async function generateDraft(source, indexes, research, revisionFeedback = '') {
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
    supportingResearch: {
      readerQuestion: research.readerQuestion,
      researchSummary: research.researchSummary,
      supportingFacts: research.supportingFacts,
      informationGain: research.informationGain,
      evidenceArtifact: research.evidenceArtifact,
      limitations: research.limitations,
    },
    revisionFeedback: compact(revisionFeedback),
  }

  const { response, payload } = await fetchOpenAIResponse({
    model: openaiModel,
    reasoning: { effort: 'high' },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              `You create original, unpublished THE SNAP NFL drafts for an editor. Treat the supplied source text and claim-level supportingResearch as the complete factual boundary: every name, number, date, quote, team-player relationship, causal claim, and historical statement must be directly supported there. Never fill gaps with plausible context, speculation, generic industry claims, or outside knowledge. Distinguish verified fact from editorial inference and state limitations. Do not copy sentence structure, paragraph order, or distinctive phrasing. Depth must follow reader utility, not an arbitrary word target: a concise accurate news update is better than padding, while analysis must contain enough evidence to answer the reader's decision. Headline drafts should generally be ${HEADLINE_WORDS_MIN}-${HEADLINE_WORDS_MAX} words. Analysis, fantasy, or feature drafts may be ${RICH_ARTICLE_WORDS_MIN}-${RICH_ARTICLE_WORDS_MAX} words only when the supplied evidence supports that depth. SourceFacts must list at least ${MIN_SOURCE_FACTS} concrete facts traceable to the original source. InformationGain must identify at least ${MIN_INFORMATION_GAINS} additions that are demonstrably present in the body and evidence artifact. KeyTakeaways must be useful decisions or conclusions, not repeated headlines. EditorialValue must state the specific utility this draft actually delivers beyond restating the source; do not claim value the body does not contain. Body headings must use real h2/h3 style values, never Markdown. Do not include raw URLs.`,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              `Create an original unpublished THE SNAP draft from this ${source.sourceName || 'NFL'} source and its verified supporting research. Return only JSON matching the schema. Lead with the verified news or direct answer, then explain the evidence and what it changes for the reader. Use short paragraphs and only as many h2 sections as help. For analysis, fantasy, ranking, or feature formats, include at least four substantive h2 sections covering method/context, evidence interpretation, actionable implications, and what could change the conclusion; meet the configured rich-article word range with evidence, not filler. The importer will insert the supplied evidenceArtifact as a native Sanity Data Table and will append the key takeaways, limitations, and sources, so do not reproduce the table as stacked text or add duplicate closing sections. Choose fantasy only when the source explicitly has fantasy/DFS intent. Never turn a partial list into a complete ranking, and never imply a tool, table, dataset, quote, or reporting that is not present. A title containing rankings, tiers, top-N, all teams, guide, table, calculator, or tool must deliver the full promised object; otherwise use a narrower literal title. Use only existing category/tag/team/topic-hub slugs. Do not select a team merely because a short abbreviation or youth team shares an NFL nickname. If revisionFeedback is present in the payload, fix every listed issue without adding any fact outside the evidence packet.\n\n` +
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
  const inferredDraftTeams = inferTeamSlugs({
    title: draft.title,
    description: draft.summary,
    articleSection: source.articleSection,
    bodyExcerpt: draftBodyText(draft),
  }, teamDocs(indexes.teams), { includeBody: true })

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
    teamSlugs: uniqueStrings([
      ...(draft.teamSlugs || []),
      ...inferTeamSlugs(source, teamDocs(indexes.teams)),
      ...inferredDraftTeams,
    ])
      .filter((slug) => allowedTeamSlugs.has(slug))
      .slice(0, 6),
    relatedPlayers: uniqueStrings(draft.relatedPlayers || []).slice(0, 8),
    imageIdea: compact(draft.imageIdea),
    sourceFacts: uniqueStrings(draft.sourceFacts || []).slice(0, 12),
    readerQuestion: compact(draft.readerQuestion),
    informationGain: uniqueStrings(draft.informationGain || []).slice(0, 4),
    keyTakeaways: uniqueStrings(draft.keyTakeaways || []).slice(0, 4),
    limitations: uniqueStrings(draft.limitations || []).slice(0, 4),
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
    if (/[.!?]$/.test(cleaned)) return cleaned
    return `${truncateAtWord(cleaned, maxLength - 1)}.`
  }

  const withinLimit = text.slice(0, maxLength + 1)
  const sentenceEnds = [...withinLimit.matchAll(/[.!?](?=\s|$)/g)]
  const lastSentenceEnd = sentenceEnds.at(-1)?.index
  if (typeof lastSentenceEnd === 'number' && lastSentenceEnd >= 89) {
    return withinLimit.slice(0, lastSentenceEnd + 1).trim()
  }

  const truncated = truncateAtWord(withinLimit, maxLength - 1).replace(/[,;:\-–—]+$/, '').trim()
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

function unsupportedNumbers(draft, source, research) {
  const sourceNumbers = new Set(
    [
      source.title,
      source.description,
      source.bodyExcerpt,
      ...(research?.supportingFacts || []).flatMap((fact) => [fact.claim, fact.metricContext]),
      ...(research?.evidenceArtifact?.columns || []),
      ...(research?.evidenceArtifact?.rows || []).flatMap((row) => row.cells || []),
    ].join(' ')
      .match(/\b\d[\d,.%$-]*\b/g) || []
  )
  const draftNumbers = uniqueStrings(
    `${draft.title || ''} ${draft.summary || ''} ${draftBodyText(draft)}`
      .match(/\b\d[\d,.%$-]*\b/g) || []
  )
  return draftNumbers.filter((number) => !sourceNumbers.has(number))
}

function titlePromiseIssue(draft, research) {
  const title = compact(draft.title)
  const rows = research?.evidenceArtifact?.rows?.length || 0
  const h2Count = (draft.body || []).filter((block) => block.style === 'h2').length

  if (/\b(calculator|tool)\b/i.test(title) && research?.evidenceArtifact?.type !== 'calculation') {
    return 'Generated title promises a calculator or tool that the evidence artifact does not deliver.'
  }
  if (/\b(tiers?|rankings?)\b/i.test(title) && rows < 5) {
    return 'Generated title promises tiers or rankings without at least five complete evidence rows.'
  }
  if (/\btable\b/i.test(title) && rows < 2) {
    return 'Generated title promises a table without a complete evidence table.'
  }

  const teamCountMatch = title.match(/\b(\d{1,2})[-\s]+team\s+(?:power\s+)?(?:rankings?|tiers?)\b/i)
  if (teamCountMatch && rows < Number.parseInt(teamCountMatch[1], 10)) {
    return `Generated title promises ${teamCountMatch[1]} teams but the evidence artifact has only ${rows} rows.`
  }
  if (
    /\ball\s+(?:32|nfl)\s+teams?\b/i.test(title) ||
    /\brank(?:ing)?\s+every\s+nfl\s+team\b/i.test(title) ||
    /\bevery\s+nfl\s+team\s+(?:ranked|ranking)\b/i.test(title) ||
    /\b(?:complete|full|league[-\s]+wide)\s+(?:nfl\s+)?(?:power\s+)?(?:rankings?|tiers?)\b/i.test(title) ||
    /\bnfl\s+power\s+rankings?\b/i.test(title)
  ) {
    if (rows < 32) return 'Generated title promises league-wide rankings without 32 complete evidence rows.'
  }
  if (/\ball 32\b/i.test(title) && rows < 32) {
    return 'Generated title promises all 32 teams without 32 complete evidence rows.'
  }

  const topMatch = title.match(/\btop[-\s]+(\d{1,2})\b/i)
  if (topMatch && rows < Number.parseInt(topMatch[1], 10)) {
    return `Generated title promises a top-${topMatch[1]} list but the evidence artifact has only ${rows} rows.`
  }

  const rangeMatch = title.match(/\bnos?\.?\s*(\d{1,3})\s*[-–]\s*(\d{1,3})\b/i)
  if (rangeMatch) {
    const expectedRows = Math.abs(Number.parseInt(rangeMatch[1], 10) - Number.parseInt(rangeMatch[2], 10)) + 1
    if (rows < expectedRows) {
      return `Generated title promises ${expectedRows} ranked entries but the evidence artifact has only ${rows} rows.`
    }
  }

  if (/\bguide\b/i.test(title) && h2Count < 3) {
    return 'Generated title promises a guide without enough structured sections to complete the intent.'
  }
  return ''
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

function draftQualityIssue(draft, source, research) {
  const bodyWords = wordCount([
    draftBodyText(draft),
    ...(draft.keyTakeaways || []),
    ...(draft.limitations || []),
    ...(research?.evidenceArtifact?.columns || []),
    ...(research?.evidenceArtifact?.rows || []).flatMap((row) => row.cells || []),
  ].join(' '))
  const richFormat = ['analysis', 'feature', 'fantasy', 'ranking'].includes(draft.format)
  const minimumWords = richFormat ? RICH_ARTICLE_WORDS_MIN : HEADLINE_WORDS_MIN
  const maximumWords = richFormat ? RICH_ARTICLE_WORDS_MAX : HEADLINE_WORDS_MAX

  if (bodyWords < minimumWords || bodyWords > maximumWords) {
    return `Generated ${draft.format} article package is ${bodyWords} words; expected ${minimumWords}-${maximumWords}.`
  }
  if ((draft.sourceFacts || []).length < MIN_SOURCE_FACTS) {
    return `Generated draft did not provide at least ${MIN_SOURCE_FACTS} source-grounded facts.`
  }
  if ((draft.informationGain || []).length < MIN_INFORMATION_GAINS) {
    return `Generated draft did not provide at least ${MIN_INFORMATION_GAINS} concrete information-gain additions.`
  }
  if ((draft.keyTakeaways || []).length < 2) {
    return 'Generated draft did not provide at least two useful key takeaways.'
  }
  if (!(draft.limitations || []).length) {
    return 'Generated draft did not state any limitation or uncertainty.'
  }
  if (draft.summary.length < 90 || draft.summary.length > 240 || !/[.!?]$/.test(draft.summary)) {
    return 'Generated summary must be a complete sentence between 90 and 240 characters.'
  }
  const repeated = repeatedBodyBlock(draft)
  if (repeated) return `Generated draft repeats a paragraph: "${repeated}…"`
  if (GENERIC_SPECULATION_PATTERN.test(`${draft.summary} ${draftBodyText(draft)}`)) {
    return 'Generated draft contains generic or unsupported speculative language.'
  }
  const promiseIssue = titlePromiseIssue(draft, research)
  if (promiseIssue) return promiseIssue
  const newNumbers = unsupportedNumbers(draft, source, research)
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
      'informationGainDelivered',
      'evidenceArtifactSupported',
      'limitationsClear',
      'unsupportedClaims',
      'entityRelationshipErrors',
      'missingPromisedElements',
      'criticalIssues',
    ],
    properties: {
      pass: { type: 'boolean' },
      intentSatisfied: { type: 'boolean' },
      originalValueDelivered: { type: 'boolean' },
      informationGainDelivered: { type: 'boolean' },
      evidenceArtifactSupported: { type: 'boolean' },
      limitationsClear: { type: 'boolean' },
      unsupportedClaims: issueArray,
      entityRelationshipErrors: issueArray,
      missingPromisedElements: issueArray,
      criticalIssues: issueArray,
    },
  }
}

async function verifyDraftAgainstSource(source, draft, research) {
  const { response, payload } = await fetchOpenAIResponse({
    model: openaiModel,
    reasoning: { effort: 'high' },
    input: [
      {
        role: 'system',
        content: [{
          type: 'input_text',
          text:
            'You are the independent fact, intent, and value gate for an NFL draft. Use only the supplied original source and claim-level supporting research. Check every name, team-player mapping, number, date, quote, causal statement, historical statement, table cell, takeaway, and limitation. Check that the headline promise is fully delivered. Information gain exists only when the article adds a supported comparison, timeline, calculation, decision framework, or analysis that helps the reader beyond restating the original source. Set evidenceArtifactSupported=true only when every table cell is supported by the evidence packet and the artifact is complete. Set pass=true only when there are zero unsupported claims, zero entity/relationship errors, zero missing promised elements, intentSatisfied=true, informationGainDelivered=true, evidenceArtifactSupported=true, limitationsClear=true, and originalValueDelivered=true. A longer rewrite is not original value.',
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
            supportingResearch: {
              readerQuestion: research.readerQuestion,
              researchSummary: research.researchSummary,
              supportingFacts: research.supportingFacts,
              informationGain: research.informationGain,
              evidenceArtifact: research.evidenceArtifact,
              limitations: research.limitations,
            },
            draft: {
              title: draft.title,
              homepageTitle: draft.homepageTitle,
              summary: draft.summary,
              format: draft.format,
              sourceFacts: draft.sourceFacts,
              readerQuestion: draft.readerQuestion,
              informationGain: draft.informationGain,
              keyTakeaways: draft.keyTakeaways,
              limitations: draft.limitations,
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
  const reportedIssues = uniqueStrings([
    ...(review?.entityRelationshipErrors || []),
    ...(review?.unsupportedClaims || []),
    ...(review?.missingPromisedElements || []),
    ...(review?.criticalIssues || []),
  ])
  if (
    review?.pass === true &&
    review?.intentSatisfied === true &&
    review?.originalValueDelivered === true &&
    review?.informationGainDelivered === true &&
    review?.evidenceArtifactSupported === true &&
    review?.limitationsClear === true &&
    reportedIssues.length === 0
  ) return ''
  const issues = [...reportedIssues]
  if (review?.intentSatisfied !== true) {
    issues.unshift('Draft does not fully satisfy the reader intent or headline promise')
  }
  if (review?.originalValueDelivered !== true) {
    issues.unshift('Draft does not deliver distinct original value beyond the source')
  }
  if (review?.informationGainDelivered !== true) {
    issues.unshift('Claimed information gain is not demonstrated in the article')
  }
  if (review?.evidenceArtifactSupported !== true) {
    issues.unshift('Evidence artifact is incomplete or not fully supported')
  }
  if (review?.limitationsClear !== true) {
    issues.unshift('Limitations or uncertainty are not stated clearly')
  }
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
  const publisher = source.sourceName || sourceNameForUrl(source.url)
  const label = compact(source.title || source.sourceTitle || publisher)
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
        text: `${publisher}: `,
        marks: [],
      },
      {
        _type: 'span',
        _key: stableKey('source-link'),
        text: `${label}${source.author ? ` (${source.author})` : ''}`,
        marks: [markKey],
      },
    ],
  }
}

function dataTableBlock(artifact) {
  return {
    _type: 'dataTable',
    _key: stableKey(`${artifact.title}-${artifact.columns.join('-')}`),
    ...(artifact.caption ? { caption: artifact.caption } : {}),
    columns: artifact.columns,
    rows: artifact.rows.map((row, index) => ({
      _type: 'dataTableRow',
      _key: stableKey(`${artifact.title}-row-${index}-${row.cells.join('-')}`),
      cells: row.cells,
    })),
  }
}

function buildBody(draft, source, research) {
  const blocks = draft.body.map((block) =>
    portableBlock(block.style, block.text, { listItem: block.listItem })
  )

  const artifact = research.evidenceArtifact
  const tableInsertIndex = blocks.findIndex((block) => block.style === 'h2')
  blocks.splice(
    tableInsertIndex >= 0 ? tableInsertIndex : blocks.length,
    0,
    portableBlock('h2', artifact.title || 'Evidence snapshot'),
    dataTableBlock(artifact)
  )

  blocks.push(portableBlock('h2', 'Key takeaways'))
  for (const takeaway of draft.keyTakeaways || []) {
    blocks.push(portableBlock('normal', takeaway, { listItem: 'bullet' }))
  }

  const limitations = uniqueStrings([...(draft.limitations || []), ...(research.limitations || [])])
  blocks.push(portableBlock('h2', 'Limits and uncertainty'))
  for (const limitation of limitations) {
    blocks.push(portableBlock('normal', limitation, { listItem: 'bullet' }))
  }

  blocks.push(portableBlock('h2', 'Sources'))
  blocks.push(sourceLinkBlock(source))
  const usedSupportingSources = new Map()
  for (const fact of research.supportingFacts || []) {
    if (!fact.sourceUrl || usedSupportingSources.has(fact.sourceUrl)) continue
    usedSupportingSources.set(fact.sourceUrl, {
      url: fact.sourceUrl,
      title: fact.sourceTitle,
      sourceName: sourceNameForUrl(fact.sourceUrl),
    })
  }
  for (const supportingSource of usedSupportingSources.values()) {
    blocks.push(sourceLinkBlock(supportingSource))
  }
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
  const sourceUrl = safeNormalizeSourceUrl(source.url)
  for (const article of recentArticles || []) {
    const articleSourceUrl = safeNormalizeSourceUrl(article.sourceUrl)
    if (sourceUrl && articleSourceUrl && articleSourceUrl === sourceUrl) return article
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

async function buildSanityDoc(source, draft, indexes, factReview, research) {
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
      generationVersion: '2026-08-evidence-led-v2',
      sourceFacts: draft.sourceFacts,
      readerQuestion: draft.readerQuestion,
      researchSummary: research.researchSummary,
      informationGain: draft.informationGain,
      keyTakeaways: draft.keyTakeaways,
      limitations: uniqueStrings([...(draft.limitations || []), ...(research.limitations || [])]),
      supportingResearchFacts: research.supportingFacts.map((fact) => ({
        _key: stableKey(`${fact.sourceUrl}-${fact.claim}`),
        _type: 'object',
        claim: fact.claim,
        sourceTitle: fact.sourceTitle,
        sourceUrl: fact.sourceUrl,
        ...(fact.sourceDate ? { sourceDate: fact.sourceDate } : {}),
        ...(fact.metricContext ? { metricContext: fact.metricContext } : {}),
      })),
      evidenceArtifactType: research.evidenceArtifact.type,
      evidenceArtifactTitle: research.evidenceArtifact.title,
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
    body: buildBody(draft, source, research),
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
  console.log(`Supporting research facts: ${(doc.automationImport?.supportingResearchFacts || []).length}`)
  console.log(`Information-gain additions: ${(draft.informationGain || []).length}`)
  console.log(`Evidence artifact: ${doc.automationImport?.evidenceArtifactType || 'none'}`)
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

  const similarArticle = findSimilarRecentArticle(source, indexes.dedupeArticles)
  if (similarArticle && !FORCE) {
    console.log(`Potential same-event article found: ${similarArticle.title} (${similarArticle._id}). Skipping duplicate draft.`)
    return { status: 'similar-existing', source, existing: similarArticle }
  }

  if (!RUN_SUPPORTING_RESEARCH) {
    const reason = 'Supporting research was explicitly disabled; evidence-led drafts require it.'
    console.log(reason)
    return { status: 'value-skip', source, reason }
  }

  if (!RUN_FACT_VERIFICATION) {
    const reason = 'Automated fact verification was explicitly disabled; evidence-led drafts require it.'
    console.log(reason)
    return { status: 'verification-skip', source, reason }
  }

  if (researchCandidateCount >= MAX_RESEARCH_CANDIDATES) {
    const reason = `Research candidate budget reached (${MAX_RESEARCH_CANDIDATES} candidates).`
    console.log(reason)
    return { status: 'research-budget-reached', source, reason }
  }
  researchCandidateCount += 1

  const research = await researchSource(source)
  const researchIssue = supportingResearchIssue(research, source)
  if (researchIssue) {
    console.log(researchIssue)
    return { status: 'value-skip', source, reason: researchIssue }
  }
  const researchReview = await verifySupportingResearch(source, research)
  const researchVerificationIssue = supportingResearchVerificationIssue(researchReview, research)
  if (researchVerificationIssue) {
    console.log(researchVerificationIssue)
    return { status: 'value-skip', source, reason: researchVerificationIssue }
  }
  console.log(`Supporting research: ${research.supportingFacts.length} cited facts across ${new Set(research.supportingFacts.map((fact) => sourceHostname(fact.sourceUrl))).size} domain(s).`)
  console.log(`Source-grounding verification: ${researchReview.claimChecks.length}/${research.supportingFacts.length} claims passed.`)
  console.log(`Evidence artifact: ${research.evidenceArtifact.type} (${research.evidenceArtifact.rows.length} rows).`)

  let draft
  let factReview
  let finalIssue = ''
  let finalStatus = 'quality-skip'
  let revisionFeedback = ''

  for (let attempt = 0; attempt <= Math.max(0, MAX_DRAFT_REVISIONS); attempt += 1) {
    if (attempt > 0) console.log(`Revising draft after gate feedback (attempt ${attempt}/${MAX_DRAFT_REVISIONS}).`)
    draft = await generateDraft(source, indexes, research, revisionFeedback)
    const qualityIssue = draftQualityIssue(draft, source, research)
    if (qualityIssue) {
      finalIssue = qualityIssue
      finalStatus = 'quality-skip'
      revisionFeedback = `Deterministic quality gate: ${qualityIssue}`
      if (attempt < MAX_DRAFT_REVISIONS) {
        console.log(`Quality gate requested a bounded revision: ${qualityIssue}`)
        continue
      }
      break
    }

    factReview = await verifyDraftAgainstSource(source, draft, research)

    const reviewIssue = factReviewIssue(factReview)
    if (reviewIssue) {
      finalIssue = reviewIssue
      finalStatus = factReview.originalValueDelivered === false ||
        factReview.informationGainDelivered === false ||
        factReview.evidenceArtifactSupported === false
        ? 'value-skip'
        : 'verification-skip'
      revisionFeedback = `Independent fact/value review: ${reviewIssue}`
      if (factReview.evidenceArtifactSupported === false) break
      if (attempt < MAX_DRAFT_REVISIONS) {
        console.log(`Independent review requested a bounded revision: ${reviewIssue}`)
        continue
      }
      break
    }

    finalIssue = ''
    break
  }

  if (finalIssue) {
    console.log(finalIssue)
    return { status: finalStatus, source, reason: finalIssue }
  }

  const doc = await buildSanityDoc(source, draft, indexes, factReview, research)
  printDraft(doc, draft)
  console.log(`Independent fact/intent verification: ${factReview.pass ? 'passed' : 'not run'}`)
  console.log(`Distinct original value already present: ${factReview.originalValueDelivered ? 'yes' : 'no'}`)

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
  let consecutiveErrors = 0
  let abortBatch = false

  for (const target of targets) {
    if (abortBatch) break
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
      sources.sort((left, right) => sourcePotentialScore(right) - sourcePotentialScore(left))
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
        consecutiveErrors = 0
        if (result.status === 'research-budget-reached') {
          abortBatch = true
          break
        }
        if (['created', 'upserted', 'generated', 'source-only'].includes(result.status)) {
          accepted += 1
          totalAccepted += 1
          if (indexes?.dedupeArticles && result.doc) {
            indexes.dedupeArticles.unshift({
              _id: result.doc._id || `same-run-${sourceBaseId(result.source.url)}`,
              title: result.source.title,
              homepageTitle: result.doc.title,
              slug: result.doc.slug?.current,
              sourceUrl: result.source.url,
            })
          }
        }
      } catch (error) {
        counts.error = (counts.error || 0) + 1
        consecutiveErrors += 1
        console.log(`Source failed without aborting the batch: ${redactSecrets(error?.message || error)}`)
        if (
          ['OPENAI_RUN_BUDGET', 'OPENAI_FATAL_REQUEST'].includes(error?.code) ||
          consecutiveErrors >= 2
        ) {
          abortBatch = true
          console.log('Stopping the batch after the global AI budget or repeated source/model failures.')
          break
        }
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
  console.log(`AI response calls: ${openaiCallCount}/${MAX_OPENAI_CALLS_PER_RUN}; HTTP attempts: ${openaiRequestCount}/${MAX_OPENAI_REQUESTS_PER_RUN}; researched candidates: ${researchCandidateCount}/${MAX_RESEARCH_CANDIDATES}.`)
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

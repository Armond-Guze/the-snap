import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import StructuredData from '@/app/components/StructuredData'
import { formatArticleDate } from '@/lib/date-utils'
import { client } from '@/sanity/lib/client'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com'

interface TopicHubPageProps {
  params: Promise<{ hub: string }>
}

interface HubArticle {
  _id: string
  _type: 'article' | 'headline' | 'rankings' | 'fantasyFootball' | string
  format?: string
  rankingType?: string
  title: string
  homepageTitle?: string
  slug?: { current?: string }
  summary?: string
  date?: string
  publishedAt?: string
  seasonYear?: number
  weekNumber?: number
  playoffRound?: string
  coverImage?: { asset?: { url?: string } }
  featuredImage?: { asset?: { url?: string } }
  image?: { asset?: { url?: string } }
  author?: { name?: string }
  category?: { title?: string; slug?: { current?: string }; color?: string }
  published?: boolean
}

interface TopicHubDoc {
  _id: string
  title: string
  navLabel?: string
  slug?: { current?: string }
  description?: string
  intro?: string
  accentColor?: string
  coverImage?: { asset?: { url?: string }; alt?: string }
  relatedCategories?: { _id: string; title?: string; slug?: { current?: string } }[]
  relatedTags?: { _id: string; title?: string; slug?: { current?: string } }[]
  categorySlugs?: string[]
  tagIds?: string[]
  featuredArticles?: HubArticle[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: { asset?: { url?: string } }
    noIndex?: boolean
    canonicalUrl?: string
  }
}

function getDefaultDraftHub(): TopicHubDoc {
  return {
    _id: 'topicHub-default-draft',
    title: 'NFL Draft',
    navLabel: 'Draft',
    slug: { current: 'draft' },
    description: 'Latest NFL Draft news, prospect risers/fallers, mocks, and team-by-team fit analysis.',
    intro:
      'Follow year-round Draft coverage with updated boards, mock movement, and team-need context. Tag draft stories to this hub in Sanity so everything stays centralized.',
    accentColor: '#1D9BF0',
    categorySlugs: ['draft'],
    tagIds: [],
    featuredArticles: [],
    relatedCategories: [],
    relatedTags: [],
  }
}

function toContentUrl(item: HubArticle): string {
  const slug = item.slug?.current?.trim()
  if (!slug) return '#'

  if (item._type === 'fantasyFootball') return `/fantasy/${slug}`
  if (item._type === 'headline') return `/headlines/${slug}`
  if (item._type === 'rankings') return `/rankings/${slug}`

  if (item._type === 'article' && item.format === 'powerRankings') {
    if (item.rankingType === 'snapshot' && item.seasonYear) {
      const weekPart = item.playoffRound
        ? item.playoffRound.toLowerCase()
        : typeof item.weekNumber === 'number'
          ? `week-${item.weekNumber}`
          : null
      if (weekPart) return `/articles/power-rankings/${item.seasonYear}/${weekPart}`
    }
    return '/articles/power-rankings'
  }

  return `/articles/${slug}`
}

function getCardImage(item: HubArticle): string | null {
  return item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url || null
}

function getKicker(item: HubArticle): string {
  if (item._type === 'fantasyFootball') return 'Fantasy'
  if (item._type === 'rankings' || item.format === 'ranking' || item.format === 'powerRankings') return 'Rankings'
  if (item._type === 'headline' || item.format === 'headline') return 'Headline'
  if (item.format === 'analysis') return 'Analysis'
  return 'Article'
}

function dedupeBySlug(items: HubArticle[]): HubArticle[] {
  const seen = new Set<string>()
  const result: HubArticle[] = []
  for (const item of items) {
    const slug = item.slug?.current?.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    result.push(item)
  }
  return result
}

async function fetchTopicHubBySlug(slug: string): Promise<TopicHubDoc | null> {
  const hub = await client.fetch<TopicHubDoc | null>(
    `*[_type == "topicHub" && slug.current == $slug && coalesce(active, true) == true][0]{
      _id,
      title,
      navLabel,
      slug,
      description,
      intro,
      accentColor,
      coverImage { asset->{ url }, alt },
      relatedCategories[]->{ _id, title, slug },
      relatedTags[]->{ _id, title, slug },
      "categorySlugs": relatedCategories[]->slug.current,
      "tagIds": relatedTags[]._ref,
      featuredArticles[]-> {
        _id,
        _type,
        format,
        rankingType,
        title,
        homepageTitle,
        slug,
        summary,
        date,
        publishedAt,
        seasonYear,
        weekNumber,
        playoffRound,
        published,
        coverImage{asset->{url}},
        featuredImage{asset->{url}},
        image{asset->{url}},
        author->{name},
        category->{title, slug, color}
      },
      seo {
        metaTitle,
        metaDescription,
        ogTitle,
        ogDescription,
        ogImage { asset->{ url } },
        noIndex,
        canonicalUrl
      }
    }`,
    { slug }
  )

  if (hub) return hub
  if (slug === 'draft') return getDefaultDraftHub()
  return null
}

async function fetchHubArticles(hub: TopicHubDoc): Promise<HubArticle[]> {
  const hubId = hub._id
  const categorySlugs = Array.isArray(hub.categorySlugs)
    ? hub.categorySlugs.filter((v): v is string => typeof v === 'string' && v.length > 0)
    : []
  const tagIds = Array.isArray(hub.tagIds)
    ? hub.tagIds.filter((v): v is string => typeof v === 'string' && v.length > 0)
    : []

  return client.fetch<HubArticle[]>(
    `*[
      published == true &&
      _type in ["article", "headline", "rankings", "fantasyFootball"] &&
      (
        (defined(topicHubs) && $hubId in topicHubs[]._ref) ||
        (defined(category) && category->slug.current in $categorySlugs) ||
        (defined(tagRefs) && count((tagRefs[]._ref)[@ in $tagIds]) > 0)
      )
    ] | order(coalesce(date, publishedAt, _createdAt) desc)[0...80]{
      _id,
      _type,
      format,
      rankingType,
      title,
      homepageTitle,
      slug,
      summary,
      date,
      publishedAt,
      seasonYear,
      weekNumber,
      playoffRound,
      coverImage{asset->{url}},
      featuredImage{asset->{url}},
      image{asset->{url}},
      author->{name},
      category->{title, slug, color}
    }`,
    {
      hubId,
      categorySlugs,
      tagIds,
    }
  )
}

export async function generateStaticParams() {
  const hubs = await client.fetch<{ slug?: { current?: string } }[]>(
    `*[_type == "topicHub" && coalesce(active, true) == true && defined(slug.current)]{ slug }`
  )

  const rows = hubs
    .map((hub) => hub.slug?.current?.trim())
    .filter((slug): slug is string => !!slug)

  return Array.from(new Set(rows)).map((slug) => ({ hub: slug }))
}

export async function generateMetadata({ params }: TopicHubPageProps): Promise<Metadata> {
  const { hub } = await params
  const slug = decodeURIComponent(hub).trim().toLowerCase()
  const topicHub = await fetchTopicHubBySlug(slug)

  if (!topicHub) {
    return {
      title: 'Topic | The Snap',
      description: 'NFL topic coverage from The Snap.',
      robots: { index: false, follow: false },
    }
  }

  const title = topicHub.seo?.metaTitle || `${topicHub.title} NFL News, Analysis & Updates | The Snap`
  const description =
    topicHub.seo?.metaDescription ||
    topicHub.description ||
    `Latest ${topicHub.title} coverage, analysis, and headlines from The Snap.`

  const canonical = topicHub.seo?.canonicalUrl || `${baseUrl}/${slug}`
  const ogImage = topicHub.seo?.ogImage?.asset?.url || topicHub.coverImage?.asset?.url

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: topicHub.seo?.noIndex ? false : true,
      follow: true,
    },
    openGraph: {
      title: topicHub.seo?.ogTitle || title,
      description: topicHub.seo?.ogDescription || description,
      url: canonical,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: topicHub.seo?.ogTitle || title,
      description: topicHub.seo?.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export const revalidate = 300

export default async function TopicHubPage({ params }: TopicHubPageProps) {
  const { hub } = await params
  const slug = decodeURIComponent(hub).trim().toLowerCase()
  const isDraftHub = slug === 'draft'

  const topicHub = await fetchTopicHubBySlug(slug)
  if (!topicHub) notFound()

  const [feedItems] = await Promise.all([fetchHubArticles(topicHub)])

  const featured = dedupeBySlug((topicHub.featuredArticles || []).filter((item) => item?.published !== false))
  const featuredSlugs = new Set(featured.map((item) => item.slug?.current?.trim()).filter(Boolean) as string[])
  const feed = dedupeBySlug(feedItems).filter((item) => {
    const contentSlug = item.slug?.current?.trim()
    if (!contentSlug) return false
    return !featuredSlugs.has(contentSlug)
  })
  const merged = [...featured, ...feed]
  const topStory = merged[0]
  const moreStories = merged.slice(1, 13)
  const heroTitle = isDraftHub ? 'Draft Latest' : topicHub.title

  const accent = topicHub.accentColor || '#1D9BF0'

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topicHub.title,
    description: topicHub.description,
    url: `${baseUrl}/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: merged.slice(0, 20).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${baseUrl}${toContentUrl(item)}`,
        name: item.homepageTitle || item.title,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-[hsl(0_0%_3.9%)] text-white">
      <StructuredData id={`sd-topic-hub-${slug}`} data={itemListSchema} />

      <section
        className="relative overflow-hidden border-b border-white/10"
        style={{ boxShadow: `inset 0 -1px 0 ${accent}66` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/90" />
        {topicHub.coverImage?.asset?.url && (
          <Image
            src={topicHub.coverImage.asset.url}
            alt={topicHub.coverImage.alt || topicHub.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
        )}

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          {!isDraftHub && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">The Snap Hub</p>}
          <h1 className="text-4xl font-black leading-tight sm:text-5xl" style={{ textShadow: `0 0 32px ${accent}55` }}>
            {heroTitle}
          </h1>
          {!isDraftHub && topicHub.description && (
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/85">{topicHub.description}</p>
          )}
          {!isDraftHub && topicHub.intro && (
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/70">{topicHub.intro}</p>
          )}

          {!isDraftHub && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(topicHub.relatedCategories || []).map((category) => {
                const categorySlug = category.slug?.current?.trim()
                if (!categorySlug) return null
                return (
                  <Link
                    key={`cat-${category._id}`}
                    href={`/categories/${categorySlug}`}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/12"
                  >
                    {category.title}
                  </Link>
                )
              })}
              {(topicHub.relatedTags || []).map((tag) => (
                <Link
                  key={`tag-${tag._id}`}
                  href={`/articles?tag=${encodeURIComponent(tag.title || '')}`}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75 hover:bg-white/12"
                >
                  #{tag.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {topStory ? (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Link
              href={toContentUrl(topStory)}
              className="group overflow-hidden rounded-2xl bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
            >
              <div className="relative h-72 w-full sm:h-96">
                {getCardImage(topStory) ? (
                  <Image
                    src={getCardImage(topStory) as string}
                    alt={topStory.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-white/70">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide text-black"
                      style={{ backgroundColor: accent }}
                    >
                      {getKicker(topStory)}
                    </span>
                    <span>{formatArticleDate(topStory.publishedAt || topStory.date)}</span>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{topStory.homepageTitle || topStory.title}</h2>
                  {topStory.summary && <p className="mt-2 line-clamp-2 text-sm text-white/85">{topStory.summary}</p>}
                </div>
              </div>
            </Link>

            <div className="space-y-3">
              {moreStories.slice(0, 4).map((item) => (
                <Link
                  key={item._id}
                  href={toContentUrl(item)}
                  className="group flex gap-3 rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.08]"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                    {getCardImage(item) ? (
                      <Image
                        src={getCardImage(item) as string}
                        alt={item.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/50">{getKicker(item)}</p>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-white/90">
                      {item.homepageTitle || item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-white/45">{formatArticleDate(item.publishedAt || item.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.03] p-6 text-white/70">
            No stories yet. Assign content to this hub using the `Topic Hubs` field in Sanity, or connect related category/tag rules.
          </div>
        )}

        {moreStories.length > 4 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreStories.slice(4).map((item) => (
              <Link
                key={item._id}
                href={toContentUrl(item)}
                className="group rounded-xl bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.08]"
              >
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/45">{getKicker(item)}</p>
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white group-hover:text-white/90">
                  {item.homepageTitle || item.title}
                </h3>
                {item.summary && <p className="mt-2 line-clamp-2 text-sm text-white/60">{item.summary}</p>}
                <p className="mt-3 text-xs text-white/45">{formatArticleDate(item.publishedAt || item.date)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

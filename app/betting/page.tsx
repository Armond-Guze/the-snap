import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetchDynamic } from '@/sanity/lib/fetch'
import { formatArticleDate } from '@/lib/date-utils'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 1800

const GUIDE_PATH = '/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more'

export const metadata: Metadata = {
  title: 'NFL Betting Guides – Odds, Spreads & Totals Explained | The Snap',
  description:
    'Plain-English NFL betting education: how to read odds, spreads, moneylines and totals, implied probability, and how betting connects to fantasy football.',
  alternates: { canonical: `${SITE_URL}/betting` },
  openGraph: {
    title: 'NFL Betting Guides | The Snap',
    description: 'Plain-English NFL betting education for beginners.',
    url: `${SITE_URL}/betting`,
    type: 'website',
  },
}

interface BettingArticle {
  _id: string
  title: string
  homepageTitle?: string
  slug?: { current?: string }
  summary?: string
  date?: string
  publishedAt?: string
}

const bettingQuery = `*[
  _type == "article" &&
  published == true &&
  !(_id in path("drafts.**")) &&
  (!defined(seo.noIndex) || seo.noIndex == false) &&
  slug.current != $guideSlug &&
  (
    title match "*betting*" || title match "*odds*" || title match "*spread*" ||
    title match "*parlay*" || title match "*moneyline*" || title match "*over/under*" ||
    title match "*prop*" || title match "*win total*" || title match "*implied*" ||
    "betting" in topicHubs[]->slug.current
  )
] | order(coalesce(publishedAt, date, _createdAt) desc)[0...24]{
  _id, title, homepageTitle, slug, summary, date, publishedAt
}`

export default async function BettingPage() {
  const articles = await sanityFetchDynamic<BettingArticle[]>(
    bettingQuery,
    { guideSlug: GUIDE_PATH.replace('/articles/', '') },
    1800,
    [],
  ).catch(() => [] as BettingArticle[])

  return (
    <main className="home-gradient home-shell min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Betting</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">NFL betting, explained simply</h1>
      <p className="mt-4 text-white/70">
        Start here if you want to understand how NFL betting works before you ever place a wager. We focus on education:
        how the numbers are set, what they mean, and how to think about risk.
      </p>

      <Link
        href={GUIDE_PATH}
        className="mt-8 block rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.08]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Start here</p>
        <h2 className="mt-1 text-xl font-semibold">NFL betting odds explained: spreads, moneylines, totals and more</h2>
        <p className="mt-2 text-sm text-white/65">
          The complete beginner guide to reading NFL odds and lines.
        </p>
      </Link>

      {articles.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">More betting guides and analysis</h2>
          <ul className="mt-4 divide-y divide-white/10">
            {articles.map((item) => {
              const slug = item.slug?.current
              if (!slug) return null
              const when = item.date || item.publishedAt
              return (
                <li key={item._id} className="py-4">
                  <Link href={`/articles/${slug}`} className="font-medium hover:underline">
                    {item.homepageTitle || item.title}
                  </Link>
                  {item.summary && <p className="mt-1 text-sm text-white/60 line-clamp-2">{item.summary}</p>}
                  {when && <p className="mt-1 text-xs text-white/40">{formatArticleDate(when)}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="mt-12 text-xs text-white/45">
        For adults 21+ where legal. The Snap provides education and analysis, not guaranteed outcomes. If gambling is a
        problem, call 1-800-GAMBLER.
      </p>
      </div>
    </main>
  )
}

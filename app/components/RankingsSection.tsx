import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";

interface ArticleItem {
  _id: string;
  _type: string;
  title: string;
  homepageTitle?: string;
  slug: { current: string };
  summary?: string;
  excerpt?: string;
  format?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
  coverImage?: { asset?: { url?: string } };
  featuredImage?: { asset?: { url?: string } };
  image?: { asset?: { url?: string } };
  fallbackCoverImage?: { asset?: { url?: string } };
  author?: { name: string };
  date?: string;
  publishedAt?: string;
}

interface RankingsSectionProps { textureSrc?: string; hideSummaries?: boolean; }

export default async function RankingsSection({ hideSummaries = false }: RankingsSectionProps) {
  const articlesQuery = `*[
    (
      _type == "article" && published == true && (
        format in ["feature","ranking","analysis"] || (format == "powerRankings" && rankingType == "snapshot")
      )
    ) ||
    ( _type == "rankings" && published == true && coalesce(rankingType, "snapshot") != "live" )
  ]
    | order(coalesce(date, publishedAt, _createdAt) desc)[0...6] {
      _id,_type,format,rankingType,title,homepageTitle,slug,summary,excerpt,
      seasonYear, weekNumber, playoffRound,
      "fallbackCoverImage": select(
        format == "powerRankings" && rankingType == "snapshot" && defined(seasonYear) =>
          *[_type == "article" && format == "powerRankings" && rankingType == "live" && seasonYear == ^.seasonYear][0].coverImage{asset->{url}},
        null
      ),
      coverImage{asset->{url}}, featuredImage{asset->{url}}, image{asset->{url}},
      author->{name}, date, publishedAt
    }`;
  const articles: ArticleItem[] = await sanityFetch(articlesQuery, {}, { next: { revalidate: 300 } }, []);
  if (!articles?.length) return null;
  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 6) || [];
  const topThree = [mainArticle, ...sideArticles.slice(0, 2)].filter(Boolean) as ArticleItem[];
  const getArticleUrl = (item: ArticleItem) => {
    if (item._type === 'article' && item.format === 'powerRankings') {
      if (item.rankingType === 'snapshot' && item.seasonYear) {
        const weekPart = item.playoffRound
          ? item.playoffRound.toLowerCase()
          : typeof item.weekNumber === 'number'
            ? `week-${item.weekNumber}`
            : null;
        if (weekPart) {
          return `/articles/power-rankings/${item.seasonYear}/${weekPart}`;
        }
      }
      return '/articles/power-rankings';
    }
    return `/articles/${item.slug.current.trim()}`;
  };
  const getItemKicker = (item: ArticleItem) => {
    if (item._type === "rankings" || item.format === "ranking" || item.format === "powerRankings") return "Rankings";
    if (item.format === "analysis") return "Analysis";
    return "Article";
  };
  const formatShortDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
  };
  const [featuredArticle, ...compactArticles] = topThree;
  return (
    <section className="relative py-10 px-4 lg:px-8 2xl:px-10 3xl:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/65 to-black/90" />
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[80rem] 3xl:max-w-[88rem] z-10">
        <div className="mb-4 2xl:mb-5 3xl:mb-6"><div className="flex flex-wrap items-center gap-8 mb-3"><h2 className="text-lg sm:text-xl 2xl:text-xl 3xl:text-2xl font-bold text-gray-300 tracking-tight">Latest Articles</h2></div></div>
        {/* Mobile: one featured + compact follow-up cards */}
        <div className="lg:hidden space-y-3">
          {featuredArticle && (() => {
            const img =
              featuredArticle.coverImage?.asset?.url ||
              featuredArticle.featuredImage?.asset?.url ||
              featuredArticle.image?.asset?.url ||
              featuredArticle.fallbackCoverImage?.asset?.url ||
              null;
            const displayTitle = featuredArticle.homepageTitle || featuredArticle.title;
            const kicker = getItemKicker(featuredArticle);
            const published = formatShortDate(featuredArticle.publishedAt || featuredArticle.date);
            return (
              <Link key={featuredArticle._id} href={getArticleUrl(featuredArticle)} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
                  {img && (
                    <Image
                      src={img}
                      alt={displayTitle}
                      width={1200}
                      height={675}
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                  {!img && <div className="h-52 w-full bg-gradient-to-br from-gray-700/80 to-gray-900/80" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                        {kicker}
                      </span>
                      {published && <span className="text-[11px] text-white/60">{published}</span>}
                    </div>
                    <h3 className="text-lg font-extrabold leading-tight text-white transition-colors group-hover:text-gray-200">
                      {displayTitle}
                    </h3>
                    {(featuredArticle.summary || featuredArticle.excerpt) && !hideSummaries && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-200/95">
                        {featuredArticle.summary || featuredArticle.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })()}

          {compactArticles.map((item) => {
            const img =
              item.coverImage?.asset?.url ||
              item.featuredImage?.asset?.url ||
              item.image?.asset?.url ||
              item.fallbackCoverImage?.asset?.url ||
              null;
            const displayTitle = item.homepageTitle || item.title;
            const kicker = getItemKicker(item);
            const published = formatShortDate(item.publishedAt || item.date);
            return (
              <Link
                key={item._id}
                href={getArticleUrl(item)}
                className="group flex gap-3 rounded-2xl bg-white/[0.03] p-3 transition-all duration-300 hover:bg-white/[0.07]"
              >
                <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      fill
                      sizes="112px"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                      {kicker}
                    </span>
                    {published && <span className="text-[10px] uppercase tracking-wide text-white/45">{published}</span>}
                  </div>
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white group-hover:text-gray-200">
                    {displayTitle}
                  </h3>
                  {(item.summary || item.excerpt) && !hideSummaries && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-400">
                      {item.summary || item.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        {/* Desktop: three uniform cards using fantasy featured style */}
        <div className="hidden lg:grid grid-cols-3 gap-3 2xl:gap-4 3xl:gap-5">
          {topThree.map((item) => {
            const img =
              item.coverImage?.asset?.url ||
              item.featuredImage?.asset?.url ||
              item.image?.asset?.url ||
              item.fallbackCoverImage?.asset?.url ||
              null;
            const displayTitle = item.homepageTitle || item.title;
            return (
            <Link key={item._id} href={getArticleUrl(item)} className="group flex flex-col">
              <div className="relative rounded-3xl overflow-hidden bg-white/[0.02] transition-all shadow-[0_22px_70px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0">
                  {img && (
                    <Image src={img} alt={displayTitle} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-contain object-center scale-[1.04] transition-transform duration-500 group-hover:scale-[1.06]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                </div>
                <div className="relative h-[250px] 2xl:h-[280px] 3xl:h-[320px]" />
              </div>
              <div className="pt-5">
                <h3 className="text-xl 2xl:text-2xl font-extrabold leading-tight text-white group-hover:text-gray-200 transition-colors">{displayTitle}</h3>
                {(item.summary || item.excerpt) && !hideSummaries && (
                  <p className="mt-3 max-w-2xl text-gray-300 text-sm 2xl:text-base leading-relaxed line-clamp-3">{item.summary || item.excerpt}</p>
                )}
              </div>
            </Link>
          );})}
        </div>
      </div>
    </section>
  );
}

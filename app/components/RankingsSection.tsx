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

interface RankingsSectionProps {
  textureSrc?: string;
  hideSummaries?: boolean;
}

export default async function RankingsSection({ hideSummaries = false }: RankingsSectionProps) {
  const articlesQuery = `*[
    (
      _type == "article" && published == true && (
        format in ["feature","ranking","analysis"] ||
        (format == "powerRankings" && coalesce(rankingType, "snapshot") in ["snapshot", "live"])
      )
    ) ||
    ( _type == "rankings" && published == true && coalesce(rankingType, "snapshot") != "live" )
  ]
    | order(
      select(
        _type == "article" && format == "powerRankings" && coalesce(rankingType, "snapshot") == "live" =>
          coalesce(_updatedAt, date, publishedAt, _createdAt),
        coalesce(date, publishedAt, _createdAt)
      ) desc
    )[0...8] {
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

  const topFive = articles.slice(0, 5);
  const [primaryFeatured, secondaryFeatured, ...compactArticles] = topFive;

  const getImageUrl = (item: ArticleItem) =>
    item.coverImage?.asset?.url ||
    item.featuredImage?.asset?.url ||
    item.image?.asset?.url ||
    item.fallbackCoverImage?.asset?.url ||
    null;

  const getArticleUrl = (item: ArticleItem) => {
    if (item._type === "article" && item.format === "powerRankings") {
      if (item.rankingType === "snapshot" && item.seasonYear) {
        const weekPart = item.playoffRound
          ? item.playoffRound.toLowerCase()
          : typeof item.weekNumber === "number"
            ? `week-${item.weekNumber}`
            : null;
        if (weekPart) {
          return `/articles/power-rankings/${item.seasonYear}/${weekPart}`;
        }
      }
      return "/articles/power-rankings";
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

  return (
    <section className="home-section-surface relative px-6 py-10 lg:px-8 2xl:px-12 3xl:px-16">
      <div className="home-section-fade pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/65 to-black/90" />
      <div className="relative z-10 mx-auto max-w-[86rem] 2xl:max-w-[94rem] 3xl:max-w-[106rem]">
        <div className="mb-4 2xl:mb-5 3xl:mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-8">
            <h2 className="text-lg font-bold tracking-tight text-gray-300 sm:text-xl 2xl:text-xl 3xl:text-2xl">Latest Articles</h2>
          </div>
        </div>

        {/* Mobile: one featured + four compact cards */}
        <div className="space-y-3 lg:hidden">
          {primaryFeatured && (() => {
            const img = getImageUrl(primaryFeatured);
            const displayTitle = primaryFeatured.homepageTitle || primaryFeatured.title;
            const kicker = getItemKicker(primaryFeatured);
            const published = formatShortDate(primaryFeatured.publishedAt || primaryFeatured.date);

            return (
              <Link key={primaryFeatured._id} href={getArticleUrl(primaryFeatured)} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      width={1200}
                      height={675}
                      priority
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-52 w-full bg-gradient-to-br from-gray-700/80 to-gray-900/80" />
                  )}
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
                    {(primaryFeatured.summary || primaryFeatured.excerpt) && !hideSummaries && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-200/95">
                        {primaryFeatured.summary || primaryFeatured.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })()}

          {topFive.slice(1).map((item) => {
            const img = getImageUrl(item);
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
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-400">{item.summary || item.excerpt}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop: two featured cards + three compact cards */}
        <div className="hidden grid-cols-12 gap-3 lg:grid 2xl:gap-4 3xl:gap-5">
          {primaryFeatured && (() => {
            const img = getImageUrl(primaryFeatured);
            const displayTitle = primaryFeatured.homepageTitle || primaryFeatured.title;
            const kicker = getItemKicker(primaryFeatured);
            const published = formatShortDate(primaryFeatured.publishedAt || primaryFeatured.date);

            return (
              <Link
                key={primaryFeatured._id}
                href={getArticleUrl(primaryFeatured)}
                className={`group rounded-3xl bg-white/[0.02] shadow-[0_22px_70px_rgba(0,0,0,0.4)] transition-all ${secondaryFeatured ? "col-span-8" : "col-span-12"}`}
              >
                <div className="relative overflow-hidden rounded-3xl">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      width={1600}
                      height={900}
                      priority
                      sizes="(min-width:1536px) 60vw, (min-width:1024px) 66vw, 100vw"
                      className="h-[300px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.05] 2xl:h-[330px] 3xl:h-[360px]"
                    />
                  ) : (
                    <div className="h-[300px] w-full bg-gradient-to-br from-gray-700/80 to-gray-900/80 2xl:h-[330px] 3xl:h-[360px]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 2xl:p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                        {kicker}
                      </span>
                      {published && <span className="text-[11px] text-white/60">{published}</span>}
                    </div>
                    <h3 className="text-2xl font-extrabold leading-tight text-white transition-colors group-hover:text-gray-200 2xl:text-3xl">
                      {displayTitle}
                    </h3>
                    {(primaryFeatured.summary || primaryFeatured.excerpt) && !hideSummaries && (
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-200/90 2xl:text-base">
                        {primaryFeatured.summary || primaryFeatured.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })()}

          {secondaryFeatured && (() => {
            const img = getImageUrl(secondaryFeatured);
            const displayTitle = secondaryFeatured.homepageTitle || secondaryFeatured.title;
            const kicker = getItemKicker(secondaryFeatured);
            const published = formatShortDate(secondaryFeatured.publishedAt || secondaryFeatured.date);

            return (
              <Link
                key={secondaryFeatured._id}
                href={getArticleUrl(secondaryFeatured)}
                className="group col-span-4 rounded-3xl bg-white/[0.02] shadow-[0_22px_70px_rgba(0,0,0,0.4)] transition-all"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      width={1000}
                      height={700}
                      sizes="(min-width:1536px) 28vw, (min-width:1024px) 32vw, 100vw"
                      className="h-[300px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.05] 2xl:h-[330px] 3xl:h-[360px]"
                    />
                  ) : (
                    <div className="h-[300px] w-full bg-gradient-to-br from-gray-700/80 to-gray-900/80 2xl:h-[330px] 3xl:h-[360px]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 2xl:p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                        {kicker}
                      </span>
                      {published && <span className="text-[11px] text-white/60">{published}</span>}
                    </div>
                    <h3 className="text-lg font-extrabold leading-tight text-white transition-colors group-hover:text-gray-200 2xl:text-xl">
                      {displayTitle}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })()}

          {compactArticles.map((item) => {
            const img = getImageUrl(item);
            const displayTitle = item.homepageTitle || item.title;
            const kicker = getItemKicker(item);
            const published = formatShortDate(item.publishedAt || item.date);

            return (
              <Link
                key={item._id}
                href={getArticleUrl(item)}
                className="group col-span-4 flex gap-3 rounded-2xl bg-white/[0.03] p-3 transition-all duration-300 hover:bg-white/[0.08]"
              >
                <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl 2xl:h-28 2xl:w-32">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      fill
                      sizes="(min-width:1536px) 160px, 140px"
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
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white group-hover:text-gray-200 2xl:text-base">
                    {displayTitle}
                  </h3>
                  {(item.summary || item.excerpt) && !hideSummaries && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-400">{item.summary || item.excerpt}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

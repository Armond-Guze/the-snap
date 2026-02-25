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

  const topSix = articles.slice(0, 6);

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-5 3xl:gap-6">
          {topSix.map((item, index) => {
            const img = getImageUrl(item);
            const displayTitle = item.homepageTitle || item.title;
            const kicker = getItemKicker(item);
            const published = formatShortDate(item.publishedAt || item.date);

            return (
              <Link
                key={item._id}
                href={getArticleUrl(item)}
                className="group overflow-hidden rounded-2xl bg-white/[0.03] shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08]"
              >
                <div className="relative h-48 sm:h-44 lg:h-48 2xl:h-52">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      fill
                      priority={index < 2}
                      sizes="(min-width:1536px) 30vw, (min-width:1280px) 33vw, (min-width:640px) 50vw, 100vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                        {kicker}
                      </span>
                      {published && <span className="text-[11px] text-white/60">{published}</span>}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white transition-colors group-hover:text-gray-200 2xl:text-xl">
                    {displayTitle}
                  </h3>
                  {(item.summary || item.excerpt) && !hideSummaries && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">
                      {item.summary || item.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/articles"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
          >
            More Articles
          </Link>
        </div>
      </div>
    </section>
  );
}

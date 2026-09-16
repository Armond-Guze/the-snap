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
    <section className="snap-latest-section home-section-surface relative px-6 py-10 lg:px-8 2xl:px-12 3xl:px-16">
      <div className="home-section-fade pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/65 to-black/90" />
      <div className="relative z-10 mx-auto max-w-[86rem] 2xl:max-w-[94rem] 3xl:max-w-[106rem]">
        <div className="mb-4 2xl:mb-5 3xl:mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-8">
            <h2 className="text-lg font-bold tracking-tight text-neutral-700 sm:text-xl 2xl:text-xl 3xl:text-2xl">Latest Articles</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {topSix.map((item) => {
            const img = getImageUrl(item);
            const displayTitle = item.homepageTitle || item.title;
            const kicker = getItemKicker(item);
            const published = formatShortDate(item.publishedAt || item.date);

            return (
              <Link
                key={item._id}
                href={getArticleUrl(item)}
                className="snap-latest-card group"
              >
                <div className="snap-latest-photo">
                  {img ? (
                    <Image
                      src={img}
                      alt={displayTitle}
                      fill
                      sizes="(min-width:1536px) 30vw, (min-width:1280px) 33vw, (min-width:640px) 50vw, calc(100vw - 3rem)"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                </div>
                <div className="snap-latest-copy">
                  <div className="snap-story-meta"><span>{kicker}</span>{published && <time>{published}</time>}</div>
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-700 2xl:text-xl">
                    {displayTitle}
                  </h3>
                  {(item.summary || item.excerpt) && !hideSummaries && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-700">
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
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
          >
            More Articles
          </Link>
        </div>
      </div>
    </section>
  );
}

import { client } from "@/sanity/lib/client";
// Fetch newest headlines/rankings for the hero section (used to skip duplicates below)
const homepageHeadlinesQuery = `
  *[
    ((_type == "article" && format == "headline") || _type == "headline" || _type == "rankings") && published == true
  ]
    | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...20] {
      _id
    }
`;
// Fetch newest articles for Latest Articles (used to skip duplicates below)
const latestArticlesQuery = `
  *[
    _type == "article" && published == true && (
      format in ["feature","ranking","analysis"] || (format == "powerRankings" && rankingType == "snapshot")
    )
  ]
    | order(coalesce(date, publishedAt, _createdAt) desc, _createdAt desc)[0...6] {
      _id
    }
`;
// Combined feed for More Headlines (headlines + rankings + articles)
const moreHeadlinesQuery = `
  *[
    (
      _type == "article" && published == true && (
        format in ["feature","ranking","analysis","headline"] || (format == "powerRankings" && rankingType == "snapshot")
      )
    ) || _type == "headline" || _type == "rankings"
  ]
    | order(coalesce(publishedAt, date, _createdAt) desc, _createdAt desc)[0...40] {
      _type,
      _id,
      title,
      homepageTitle,
      summary,
      slug,
      format,
      rankingType,
      seasonYear,
      weekNumber,
      playoffRound,
      date,
      "fallbackCoverImage": select(
        format == "powerRankings" && rankingType == "snapshot" && defined(seasonYear) =>
          *[_type == "article" && format == "powerRankings" && rankingType == "live" && seasonYear == ^.seasonYear][0].coverImage{asset->{url}},
        null
      ),
      coverImage { asset->{ url } },
      featuredImage { asset->{ url } },
      image { asset->{ url } },
      author->{ name },
      publishedAt
    }
`;
import Link from "next/link";
import Image from "next/image";

interface MoreHeadlinesSectionProps {
  textureSrc?: string;
  hideSummaries?: boolean;
}

interface HeadlineImageAssetRef { asset?: { _ref?: string; _id?: string; url?: string }; [key: string]: unknown }
interface HeadlineItem {
  _id: string;
  _type?: string;
  title: string;
  homepageTitle?: string;
  summary?: string;
  slug?: { current?: string };
  format?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
  date?: string;
  fallbackCoverImage?: HeadlineImageAssetRef;
  coverImage?: HeadlineImageAssetRef;
  featuredImage?: HeadlineImageAssetRef;
  image?: HeadlineImageAssetRef;
  author?: { name?: string };
  publishedAt?: string;
}

export default async function MoreHeadlinesSection({ hideSummaries = false }: MoreHeadlinesSectionProps) {
  const [headlineIds, articleIds, combinedFeed] = await Promise.all([
    client.fetch<{ _id: string }[]>(homepageHeadlinesQuery),
    client.fetch<{ _id: string }[]>(latestArticlesQuery),
    client.fetch<HeadlineItem[]>(moreHeadlinesQuery),
  ]);

  // Skip items already displayed above (first 9 headlines + first 3 latest articles)
  const skipIds = new Set([
    ...(headlineIds || []).slice(0, 9).map((item) => item._id),
    ...(articleIds || []).slice(0, 3).map((item) => item._id),
  ]);

  // Keep section size consistent with prior layout (20 total with 9 already used in Headlines)
  const START_INDEX = 9;
  const MAX_TOTAL = 20;
  const remainingSlots = Math.max(0, MAX_TOTAL - START_INDEX);
  const seenKeys = new Set<string>();
  const moreHeadlines = (combinedFeed || [])
    .filter((item) => !skipIds.has(item._id))
    .filter((item) => {
      const key = item.slug?.current?.trim() || item._id;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    })
    .slice(0, remainingSlots);

  const getItemUrl = (item: HeadlineItem) => {
    if (item._type === 'article') {
      if (item.format === 'powerRankings') {
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
      return item.slug?.current ? `/articles/${item.slug.current.trim()}` : '#';
    }
    return item.slug?.current ? `/headlines/${item.slug.current.trim()}` : '#';
  };

  const getItemKicker = (item: HeadlineItem) => {
    if (item._type === "rankings" || item.format === "ranking" || item.format === "powerRankings") return "Rankings";
    if (item.format === "analysis") return "Analysis";
    if (item._type === "headline" || item.format === "headline") return "Headline";
    return "Article";
  };

  const formatItemDate = (item: HeadlineItem) => {
    const raw = item.publishedAt || item.date;
    if (!raw) return null;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
  };

  return (
    <section className="relative overflow-hidden py-14 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-8 -z-10 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        <div className="mb-6 flex items-end justify-between pb-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Around The League</p>
            <h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-200">More Headlines</h2>
          </div>
          <span className="hidden sm:inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
            Latest Mix
          </span>
        </div>
        <div className="space-y-3">
          {moreHeadlines.map((item: HeadlineItem) => {
            const author = item.author?.name;
            const imgUrl =
              item.coverImage?.asset?.url ||
              item.featuredImage?.asset?.url ||
              item.image?.asset?.url ||
              item.fallbackCoverImage?.asset?.url ||
              null;
            const href = getItemUrl(item);
            const kicker = getItemKicker(item);
            const published = formatItemDate(item);
            return (
              <Link
                key={item._id}
                href={href}
                className="group relative flex gap-4 sm:gap-5 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3 sm:p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <div className="relative h-28 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-800/40 sm:h-32 sm:w-40 lg:w-44">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={item.title}
                      fill
                      className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.06]"
                      sizes="(max-width:640px) 150px, (max-width:1024px) 180px, 190px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8z"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col pt-1.5 sm:pt-2">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/75">
                      {kicker}
                    </span>
                    {published && <span className="text-[11px] text-white/45">{published}</span>}
                  </div>
                  <h3 className="mb-1.5 line-clamp-2 text-[17px] font-semibold leading-snug text-gray-100 group-hover:text-white sm:text-[18px]">
                    {item.homepageTitle || item.title}
                  </h3>
                  {item.summary && !hideSummaries && (
                    <p className="mb-1.5 hidden line-clamp-2 text-sm leading-snug text-gray-400/90 md:block">{item.summary}</p>
                  )}
                  {author && (
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 group-hover:text-gray-300">{author}</p>
                  )}
                </div>
              </Link>
            );
          })}
          {moreHeadlines.length === 0 && (
            <div className="rounded-xl bg-white/[0.02] p-4 text-sm text-gray-400">
              No additional headlines available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

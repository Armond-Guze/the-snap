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
  coverImage?: HeadlineImageAssetRef;
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
  const moreHeadlines = (combinedFeed || [])
    .filter((item) => !skipIds.has(item._id))
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

  return (
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {/* Remove heavy tint so cards stay vibrant */}
      <div className="pointer-events-none absolute inset-0 -z-10" />
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        <div className="mb-6">
          <h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-300">More Headlines</h2>
        </div>
        <div className="space-y-4">
          {moreHeadlines.map((item: HeadlineItem) => {
            const author = item.author?.name;
            const imgUrl =
              item.coverImage?.asset?.url ||
              (item as any).featuredImage?.asset?.url ||
              (item as any).image?.asset?.url ||
              null;
            const href = getItemUrl(item);
            return (
              <Link
                key={item._id}
                href={href}
                className="group flex gap-5 p-3 sm:p-4 rounded-xl border border-white/8 bg-transparent hover:bg-white/5 hover:border-white/20 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <div className="relative w-32 sm:w-40 lg:w-44 h-28 sm:h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-800/40">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={item.title}
                      fill
                      className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.06]"
                      sizes="(max-width:640px) 150px, (max-width:1024px) 180px, 190px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8z"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1 pt-2 sm:pt-3">
                  <h3 className="text-[17px] sm:text-[18px] font-semibold leading-snug text-gray-100 group-hover:text-white line-clamp-2 mb-1.5">{item.homepageTitle || item.title}</h3>
                  {item.summary && !hideSummaries && (
                    <p className="text-sm text-gray-400/90 line-clamp-2 hidden md:block mb-1.5 leading-snug">{item.summary}</p>
                  )}
                  {author && (
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 group-hover:text-gray-300">{author}</p>
                  )}
                </div>
              </Link>
            );
          })}
          {moreHeadlines.length === 0 && <div className="text-gray-400 text-sm">No additional headlines available.</div>}
        </div>
      </div>
    </section>
  );
}

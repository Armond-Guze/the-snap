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
  return (
    <section className="relative py-10 px-6 lg:px-8 2xl:px-10 3xl:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/65 to-black/90" />
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[80rem] 3xl:max-w-[88rem] z-10">
        <div className="mb-4 2xl:mb-5 3xl:mb-6"><div className="flex flex-wrap items-center gap-8 mb-3"><h2 className="text-lg sm:text-xl 2xl:text-xl 3xl:text-2xl font-bold text-gray-300 tracking-tight">Latest Articles</h2></div></div>
        {/* Mobile: stacked cards using fantasy featured style */}
        <div className="lg:hidden space-y-6">
          {topThree.map((item) => {
            const img = item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url || null;
            const displayTitle = item.homepageTitle || item.title;
            return (
            <Link key={item._id} href={getArticleUrl(item)} className="group block">
              <div className="relative rounded-3xl overflow-hidden bg-white/[0.02] transition-all shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0">
                  {img ? (
                    <Image src={img} alt={displayTitle} fill sizes="(max-width:640px) 100vw" className="object-contain object-center scale-[1.04] bg-black/35 opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                </div>
                <div className="relative h-56 sm:h-60" />
              </div>
              <div className="pt-4">
                <h3 className="text-lg font-extrabold leading-tight text-white group-hover:text-gray-200 transition-colors">{displayTitle}</h3>
                {(item.summary || item.excerpt) && !hideSummaries && (
                  <p className="mt-2 max-w-2xl text-gray-300 text-sm leading-relaxed line-clamp-3">{item.summary || item.excerpt}</p>
                )}
              </div>
            </Link>
          );})}
        </div>
        {/* Desktop: three uniform cards using fantasy featured style */}
        <div className="hidden lg:grid grid-cols-3 gap-3 2xl:gap-4 3xl:gap-5">
          {topThree.map((item) => {
            const img = item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url || null;
            const displayTitle = item.homepageTitle || item.title;
            return (
            <Link key={item._id} href={getArticleUrl(item)} className="group flex flex-col">
              <div className="relative rounded-3xl overflow-hidden bg-white/[0.02] transition-all shadow-[0_22px_70px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0">
                  {img && (
                    <Image src={img} alt={displayTitle} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-contain object-center scale-[1.04] bg-black/35 opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
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

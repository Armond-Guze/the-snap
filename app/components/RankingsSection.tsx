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
        format in ["feature","ranking","analysis","powerRankings"]
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
            <Link key={item._id} href={getArticleUrl(item)} className="group relative block rounded-3xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-white/10">
              <div className="absolute inset-0">
                {img ? (
                  <Image src={img} alt={displayTitle} fill sizes="(max-width:640px) 100vw" className="object-cover opacity-35 group-hover:opacity-45 transition-opacity duration-500" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
              <div className="relative h-72 sm:h-80 flex flex-col justify-end p-6">
                <h3 className="text-2xl font-extrabold leading-tight mb-3 max-w-3xl drop-shadow-lg text-white">{displayTitle}</h3>
                {(item.summary || item.excerpt) && !hideSummaries && (
                  <p className="max-w-2xl text-gray-300 text-sm leading-relaxed line-clamp-3">{item.summary || item.excerpt}</p>
                )}
                <div className="mt-4 flex items-center text-[11px] text-gray-300/80">
                  <span>{item.author?.name || 'Staff Writer'}</span>
                  {(item.publishedAt || item.date) && <span className="mx-2">•</span>}
                  {(item.publishedAt || item.date) && (
                    <time dateTime={item.publishedAt || item.date}>{new Date(item.publishedAt || item.date || '').toLocaleDateString()}</time>
                  )}
                </div>
              </div>
            </Link>
          );})}
        </div>
        {/* Desktop: three uniform cards using fantasy featured style */}
        <div className="hidden lg:grid grid-cols-3 gap-6 2xl:gap-7 3xl:gap-8">
          {topThree.map((item) => {
            const img = item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url || null;
            const displayTitle = item.homepageTitle || item.title;
            return (
            <Link key={item._id} href={getArticleUrl(item)} className="group relative flex-1 rounded-3xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-white/10">
              <div className="absolute inset-0">
                {img && (
                  <Image src={img} alt={displayTitle} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover opacity-35 group-hover:opacity-45 transition-opacity duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
              <div className="relative h-[360px] 2xl:h-[420px] 3xl:h-[460px] flex flex-col justify-end p-8">
                <h3 className="text-2xl 2xl:text-3xl font-extrabold leading-tight mb-4 max-w-3xl drop-shadow-lg text-white">{displayTitle}</h3>
                {(item.summary || item.excerpt) && !hideSummaries && (
                  <p className="max-w-2xl text-gray-300 text-sm 2xl:text-base leading-relaxed line-clamp-3">{item.summary || item.excerpt}</p>
                )}
                <div className="mt-5 flex items-center text-xs text-gray-300/80">
                  <span>{item.author?.name || 'Staff Writer'}</span>
                  {(item.publishedAt || item.date) && <span className="mx-2">•</span>}
                  {(item.publishedAt || item.date) && (
                    <time dateTime={item.publishedAt || item.date}>{new Date(item.publishedAt || item.date || '').toLocaleDateString()}</time>
                  )}
                </div>
              </div>
            </Link>
          );})}
        </div>
      </div>
    </section>
  );
}

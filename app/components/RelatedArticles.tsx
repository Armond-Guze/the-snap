import Link from "next/link";
import Image from "next/image";
import { THUMB_SIZES } from '@/lib/image-sizes';
import { Calendar, Eye } from "lucide-react";
import type { HeadlineListItem } from "@/types";
import { formatCompactDate } from "@/lib/date-utils";

interface RelatedArticlesProps {
  currentSlug: string;
  articles?: HeadlineListItem[];
}

export default function RelatedArticles({ 
  currentSlug, 
  articles = []
}: RelatedArticlesProps) {
  // Filter out current article and get smart recommendations
  // Unified list: filter out current article, cap to 24 for sidebar performance
  const relatedArticles = articles
    .filter((article) => article.slug.current !== currentSlug)
    .filter((article) => !(article._type === 'article' && article.format === 'powerRankings'))
    .slice(0, 6); // limit to 6 recommended articles

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineListItem) => {
    if (item._type === 'rankings') return `/articles/${item.slug.current}`;
    if (item._type === 'article') {
      if (item.format === 'powerRankings' && item.seasonYear) {
        const weekPart = item.playoffRound
          ? item.playoffRound.toLowerCase()
          : typeof item.weekNumber === 'number'
            ? `week-${item.weekNumber}`
            : null;
        if (weekPart) {
          return `/articles/power-rankings/${item.seasonYear}/${weekPart}`;
        }
      }
      return `/articles/${item.slug.current}`;
    }
    return `/headlines/${item.slug.current}`;
  };

  if (relatedArticles.length === 0) return null;

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <h2 className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
        Keep Reading
      </h2>
      <div className="space-y-1.5">
        {relatedArticles.map((article) => {
          const img = article.featuredImage?.asset?.url || article.coverImage?.asset?.url || article.image?.asset?.url;
          return (
            <Link
              key={article._id}
              href={getArticleUrl(article)}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg"
            >
              <div className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.05]">
                <div className="relative h-14 w-[76px] flex-shrink-0 overflow-hidden rounded-md bg-gray-700/40 lg:h-16 lg:w-20">
                  {img ? (
                    <Image
                      src={img}
                      alt={article.title}
                      fill
                      sizes={THUMB_SIZES}
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <h3 className="line-clamp-2 text-[12.5px] lg:text-[13px] font-semibold leading-snug text-white group-hover:text-gray-300 transition-colors">
                    {article.homepageTitle || article.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] lg:text-[10px] text-gray-400">
                    <span className="inline-flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatCompactDate(article.date || article.publishedAt)}
                    </span>
                    {article._type === 'rankings' && article.rankingType && (
                      <span className="text-purple-400 font-medium">
                        {article.rankingType.replace('-', ' ').toUpperCase()} RANKINGS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

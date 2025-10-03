import Link from "next/link";
import Image from "next/image";
import { THUMB_SIZES } from '@/lib/image-sizes';
import { Calendar, TrendingUp, Eye } from "lucide-react";
import type { HeadlineListItem } from "@/types";
import { formatCompactDate } from "@/lib/date-utils";

interface RelatedArticlesProps {
  currentSlug: string;
  articles: HeadlineListItem[];
}

export default function RelatedArticles({ 
  currentSlug, 
  articles
}: RelatedArticlesProps) {
  // Filter out current article and get smart recommendations
  // Unified list: filter out current article, cap to 24 for sidebar performance
  const relatedArticles = articles
    .filter((article) => article.slug.current !== currentSlug)
    .slice(0, 6); // limit to 6 recommended articles

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineListItem) => {
    if (item._type === 'rankings') {
      return `/rankings/${item.slug.current}`;
    }
    return `/headlines/${item.slug.current}`;
  };

  if (relatedArticles.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="bg-black/60 backdrop-blur-sm rounded-2xl pt-4 pb-3 border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-white mr-2" />
            <h2 className="text-lg font-semibold text-white tracking-tight">Recommended</h2>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">You may also like</div>
        </div>
        <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {relatedArticles.map((article, idx) => {
            const img = article.featuredImage?.asset?.url || article.coverImage?.asset?.url || article.image?.asset?.url;
            const isPrimary = idx === 0; // make first one larger
            return (
              <Link
                key={article._id}
                href={getArticleUrl(article)}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-xl"
              >
                <div className={
                  `flex ${isPrimary ? 'flex-row' : 'flex-row'} gap-4 p-3 lg:p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors`}
                >
                  <div className={
                    `relative overflow-hidden rounded-md flex-shrink-0 ${isPrimary ? 'w-32 h-24 lg:w-40 lg:h-28' : 'w-20 h-16 lg:w-24 lg:h-18'} bg-gray-700/40`
                  }>
                    {img ? (
                      <Image
                        src={img}
                        alt={article.title}
                        fill
                        sizes={THUMB_SIZES}
                        className="object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className={`font-semibold text-white ${isPrimary ? 'text-sm lg:text-base' : 'text-[13px] lg:text-[14px]'} leading-snug line-clamp-2 group-hover:text-gray-300 transition-colors`}> 
                      {article.homepageTitle || article.title}
                    </h3>
                    <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] lg:text-[11px] text-gray-400">
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
    </div>
  );
}
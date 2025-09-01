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
      {/* Trending/Featured Articles */}
      <div className="bg-black rounded-2xl pb-4">
        <div className="flex items-center mb-4 px-2">
          <TrendingUp className="w-5 h-5 text-white mr-2" />
          <h2 className="text-lg font-semibold text-white">Recommended</h2>
        </div>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {relatedArticles.map(article => (
            <Link
              key={article._id}
              href={getArticleUrl(article)}
              className="group block"
            >
              <div className="flex gap-3 p-2 lg:p-3 rounded-md hover:bg-gray-800/50 transition-colors">
                <div className="relative w-14 h-11 lg:w-20 lg:h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-700/40">
                  {(() => {
                    const img = article.featuredImage?.asset?.url || article.coverImage?.asset?.url || article.image?.asset?.url;
                    if (img) {
                      return (
                        <Image
                          src={img}
                          alt={article.title}
                          fill
                          sizes={THUMB_SIZES}
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      );
                    }
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-[13px] lg:text-sm leading-snug line-clamp-2 group-hover:text-gray-300 transition-colors">
                    {article.homepageTitle || article.title}
                  </h3>
                  <div className="mt-1 flex items-center text-[10px] lg:text-[11px] text-gray-500 gap-2">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatCompactDate(article.date || article.publishedAt)}
                    </div>
                    {article._type === 'rankings' && article.rankingType && (
                      <span className="text-purple-400 font-medium">
                        {article.rankingType.replace('-', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
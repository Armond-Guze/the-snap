import Link from "next/link";
import Image from "next/image";
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
  const relatedArticles = articles
    .filter((article) => article.slug.current !== currentSlug)
    .slice(0, 6);

  const featuredArticles = relatedArticles.slice(0, 2);

  if (relatedArticles.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Trending/Featured Articles */}
      <div className="bg-black rounded-2xl pb-6">
        <div className="flex items-center mb-6">
          <TrendingUp className="w-5 h-5 text-white mr-3" />
          <h2 className="text-xl font-bold  text-white">Headlines</h2>
        </div>
        <div className="space-y-3">
          {featuredArticles.map((article) => (
            <Link
              key={article._id}
              href={`/headlines/${article.slug.current}`}
              className="group block"
            >
              <div className="flex gap-3 p-3 rounded-xl hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-300">
                {/* Smaller thumbnail */}
                <div className="relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                  {article.coverImage?.asset?.url ? (
                    <Image
                      src={article.coverImage.asset.url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-gray-300 transition-colors mb-2">
                    {article.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatCompactDate(article.date)}
                    </div>
                    {article.author?.name && (
                      <span>by {article.author.name}</span>
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